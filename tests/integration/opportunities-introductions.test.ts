// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createTenantCapability } from "@/server/services/capabilities";
import { createTenantCompany } from "@/server/services/companies";
import {
  archiveTenantIntroductionSuggestion,
  createTenantIntroductionSuggestion,
  dismissTenantIntroductionSuggestion,
  getTenantIntroductionSuggestion,
  getTenantIntroductionSuggestionProfile,
  listTenantIntroductionSuggestionsWithContext,
  updateTenantIntroductionSuggestion,
} from "@/server/services/introduction-suggestions";
import { createTenantMeeting } from "@/server/services/meetings";
import { createTenantNeed } from "@/server/services/needs";
import { createTenantNote } from "@/server/services/notes";
import { getTenantOpportunityHub } from "@/server/services/opportunities";
import { createTenantPerson } from "@/server/services/people";
import {
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

async function createIntroductionContext(email: string) {
  const context = await createTenantContext(email);
  const fromCompany = await createTenantCompany(context, {
    name: `${email} From Company`,
  });
  const toCompany = await createTenantCompany(context, {
    name: `${email} To Company`,
  });
  const fromPerson = await createTenantPerson(context, {
    displayName: `${email} From Person`,
  });
  const toPerson = await createTenantPerson(context, {
    displayName: `${email} To Person`,
  });
  const meeting = await createTenantMeeting(context, {
    primaryCompanyId: fromCompany.id,
    title: `${email} Meeting`,
  });
  const note = await createTenantNote(context, {
    body: `${email} note body must not leak`,
    companyId: fromCompany.id,
    meetingId: meeting.id,
    noteType: "MEETING",
    personId: fromPerson.id,
    summary: `${email} note summary`,
  });
  const need = await createTenantNeed(context, {
    companyId: fromCompany.id,
    description: "Need description must stay out of audit logs.",
    meetingId: meeting.id,
    needType: "REQUEST",
    noteId: note.id,
    personId: fromPerson.id,
    priority: "HIGH",
    title: `${email} Need`,
  });
  const capability = await createTenantCapability(context, {
    capabilityType: "EXPERTISE",
    companyId: toCompany.id,
    description: "Capability description must stay out of audit logs.",
    noteId: note.id,
    personId: toPerson.id,
    title: `${email} Capability`,
  });

  return {
    capability,
    context,
    fromCompany,
    fromPerson,
    meeting,
    need,
    note,
    toCompany,
    toPerson,
  };
}

describeWithDatabase("opportunities introduction suggestions workflow", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates, edits, archives, and dismisses tenant-scoped introductions safely", async () => {
    const data = await createIntroductionContext("intro-workflow@example.com");
    const suggestion = await createTenantIntroductionSuggestion(data.context, {
      capabilityId: data.capability.id,
      confidence: 0.72,
      fromPersonId: data.fromPerson.id,
      needId: data.need.id,
      rationale: "Sensitive rationale should not appear in audit metadata.",
      sourceMeetingId: data.meeting.id,
      sourceNoteId: data.note.id,
      toPersonId: data.toPerson.id,
    });

    await expect(
      getTenantIntroductionSuggestionProfile(data.context, suggestion.id),
    ).resolves.toMatchObject({
      capabilityId: data.capability.id,
      fromPersonId: data.fromPerson.id,
      needId: data.need.id,
      tenantId: data.context.tenantId,
      toPersonId: data.toPerson.id,
    });

    const sourceReferences = await prisma.sourceReference.findMany({
      where: {
        targetEntityId: suggestion.id,
        targetEntityType: "INTRODUCTION_SUGGESTION",
        tenantId: data.context.tenantId,
      },
    });

    expect(sourceReferences).toHaveLength(2);
    expect(sourceReferences.map((reference) => reference.sourceEntityType)).toEqual(
      expect.arrayContaining(["MEETING", "NOTE"]),
    );

    const updated = await updateTenantIntroductionSuggestion(
      data.context,
      suggestion.id,
      {
        capabilityId: data.capability.id,
        confidence: 0.9,
        fromCompanyId: data.fromCompany.id,
        needId: data.need.id,
        rationale: "Updated rationale should stay private.",
        status: "OPT_IN_REQUESTED",
        toCompanyId: data.toCompany.id,
      },
    );

    expect(updated).toMatchObject({
      confidence: 0.9,
      fromCompanyId: data.fromCompany.id,
      status: "OPT_IN_REQUESTED",
      toCompanyId: data.toCompany.id,
    });

    const dismissed = await dismissTenantIntroductionSuggestion(
      data.context,
      suggestion.id,
    );

    expect(dismissed.status).toBe("REJECTED");

    const archived = await archiveTenantIntroductionSuggestion(
      data.context,
      suggestion.id,
    );

    expect(archived.archivedAt).toBeInstanceOf(Date);
    await expect(
      getTenantIntroductionSuggestion(data.context, suggestion.id),
    ).resolves.toBeNull();

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "introduction_suggestion.created",
            "introduction_suggestion.updated",
            "introduction_suggestion.dismissed",
            "introduction_suggestion.archived",
          ],
        },
        entityId: suggestion.id,
        tenantId: data.context.tenantId,
      },
    });
    const metadata = JSON.stringify(auditLogs.map((log) => log.metadata));

    expect(auditLogs).toHaveLength(4);
    expect(metadata).toContain(data.need.id);
    expect(metadata).toContain(data.capability.id);
    expect(metadata).not.toContain("Sensitive rationale");
    expect(metadata).not.toContain("Updated rationale");
    expect(metadata).not.toContain("note body must not leak");
  });

  it("links introductions to needs, capabilities, people, and companies", async () => {
    const data = await createIntroductionContext("intro-links@example.com");
    const suggestion = await createTenantIntroductionSuggestion(data.context, {
      capabilityId: data.capability.id,
      fromCompanyId: data.fromCompany.id,
      fromPersonId: data.fromPerson.id,
      needId: data.need.id,
      rationale: "Manual connection between buyer need and expert capability.",
      toCompanyId: data.toCompany.id,
      toPersonId: data.toPerson.id,
    });

    const profile = await getTenantIntroductionSuggestionProfile(
      data.context,
      suggestion.id,
    );

    expect(profile).toMatchObject({
      capability: {
        id: data.capability.id,
      },
      fromCompany: {
        id: data.fromCompany.id,
      },
      fromPerson: {
        id: data.fromPerson.id,
      },
      need: {
        id: data.need.id,
      },
      toCompany: {
        id: data.toCompany.id,
      },
      toPerson: {
        id: data.toPerson.id,
      },
    });
  });

  it("rejects cross-tenant reads, writes, links, and provenance", async () => {
    const first = await createIntroductionContext("intro-first@example.com");
    const second = await createIntroductionContext("intro-second@example.com");
    const suggestion = await createTenantIntroductionSuggestion(first.context, {
      capabilityId: first.capability.id,
      needId: first.need.id,
      rationale: "Tenant-scoped suggestion.",
    });

    await expect(
      getTenantIntroductionSuggestion(second.context, suggestion.id),
    ).resolves.toBeNull();
    await expect(
      updateTenantIntroductionSuggestion(second.context, suggestion.id, {
        capabilityId: first.capability.id,
        needId: first.need.id,
        rationale: "Invalid update.",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      createTenantIntroductionSuggestion(first.context, {
        capabilityId: second.capability.id,
        needId: first.need.id,
        rationale: "Invalid cross tenant capability.",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      createTenantIntroductionSuggestion(first.context, {
        capabilityId: first.capability.id,
        needId: first.need.id,
        rationale: "Invalid cross tenant source note.",
        sourceNoteId: second.note.id,
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("rejects self introductions and suggestions without enough context", async () => {
    const data = await createIntroductionContext("intro-validation@example.com");

    await expect(
      createTenantIntroductionSuggestion(data.context, {
        fromPersonId: data.fromPerson.id,
        rationale: "Missing enough linked context.",
      }),
    ).rejects.toThrow("at least two linked records");
    await expect(
      createTenantIntroductionSuggestion(data.context, {
        fromPersonId: data.fromPerson.id,
        rationale: "Same person on both sides.",
        toPersonId: data.fromPerson.id,
      }),
    ).rejects.toThrow("same person");
  });

  it("keeps opportunities hub introduction summaries tenant-scoped", async () => {
    const first = await createIntroductionContext("intro-hub-first@example.com");
    const second = await createIntroductionContext("intro-hub-second@example.com");

    await createTenantIntroductionSuggestion(first.context, {
      capabilityId: first.capability.id,
      needId: first.need.id,
      rationale: "First tenant suggestion.",
    });
    await createTenantIntroductionSuggestion(second.context, {
      capabilityId: second.capability.id,
      needId: second.need.id,
      rationale: "Second tenant suggestion.",
    });

    const hub = await getTenantOpportunityHub(first.context);
    const introductions = await listTenantIntroductionSuggestionsWithContext(
      first.context,
    );

    expect(hub.counts.activeIntroductions).toBe(1);
    expect(hub.latestIntroductions.map((suggestion) => suggestion.rationale)).toContain(
      "First tenant suggestion.",
    );
    expect(introductions.map((suggestion) => suggestion.rationale)).not.toContain(
      "Second tenant suggestion.",
    );
  });
});
