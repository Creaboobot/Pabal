// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import {
  archiveTenantCapability,
  createTenantCapability,
  getTenantCapability,
  getTenantCapabilityProfile,
  listTenantCapabilitiesWithContext,
  updateTenantCapability,
} from "@/server/services/capabilities";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantMeeting } from "@/server/services/meetings";
import {
  archiveTenantNeed,
  createTenantNeed,
  getTenantNeed,
  getTenantNeedProfile,
  listTenantNeedsWithContext,
  updateTenantNeed,
} from "@/server/services/needs";
import { createTenantNote } from "@/server/services/notes";
import { getTenantOpportunityHub } from "@/server/services/opportunities";
import { createTenantPerson } from "@/server/services/people";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

async function createOpportunityContext(email: string) {
  const context = await createTenantContext(email);
  const company = await createTenantCompany(context, {
    name: `${email} Company`,
  });
  const person = await createTenantPerson(context, {
    displayName: `${email} Person`,
  });
  const meeting = await createTenantMeeting(context, {
    primaryCompanyId: company.id,
    title: `${email} Meeting`,
  });
  const note = await createTenantNote(context, {
    body: `${email} note body must not leak`,
    companyId: company.id,
    meetingId: meeting.id,
    noteType: "MEETING",
    personId: person.id,
    summary: `${email} note summary`,
  });

  return {
    company,
    context,
    meeting,
    note,
    person,
  };
}

describeWithDatabase("opportunities needs and capabilities workflow", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates, edits, and archives tenant-scoped needs safely", async () => {
    const data = await createOpportunityContext("need-workflow@example.com");
    const reviewAfter = new Date("2026-05-18T00:00:00.000Z");
    const need = await createTenantNeed(data.context, {
      companyId: data.company.id,
      confidence: 0.72,
      description: "Do not leak this need description into audit metadata.",
      meetingId: data.meeting.id,
      needType: "REQUIREMENT",
      noteId: data.note.id,
      personId: data.person.id,
      priority: "HIGH",
      reviewAfter,
      sensitivity: "SENSITIVE_BUSINESS",
      title: "Need practical MBSE examples",
    });

    await expect(getTenantNeedProfile(data.context, need.id)).resolves.toMatchObject({
      companyId: data.company.id,
      meetingId: data.meeting.id,
      noteId: data.note.id,
      personId: data.person.id,
      reviewAfter,
      tenantId: data.context.tenantId,
    });

    const updated = await updateTenantNeed(data.context, need.id, {
      companyId: data.company.id,
      confidence: 0.81,
      description: "Updated description that should stay out of audit.",
      meetingId: data.meeting.id,
      needType: "OPPORTUNITY",
      noteId: data.note.id,
      personId: data.person.id,
      priority: "CRITICAL",
      reviewAfter: null,
      sensitivity: "CONFIDENTIAL",
      status: "IN_PROGRESS",
      title: "Updated need",
    });

    expect(updated).toMatchObject({
      priority: "CRITICAL",
      reviewAfter: null,
      status: "IN_PROGRESS",
      title: "Updated need",
    });
    await expect(getTenantNeedProfile(data.context, need.id)).resolves.toMatchObject({
      reviewAfter: null,
    });

    const archived = await archiveTenantNeed(data.context, need.id);

    expect(archived.archivedAt).toBeInstanceOf(Date);
    await expect(getTenantNeed(data.context, need.id)).resolves.toBeNull();

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ["need.created", "need.updated", "need.archived"],
        },
        entityId: need.id,
        tenantId: data.context.tenantId,
      },
    });
    const metadata = JSON.stringify(auditLogs.map((log) => log.metadata));

    expect(auditLogs).toHaveLength(3);
    expect(metadata).toContain(data.person.id);
    expect(metadata).toContain("SENSITIVE_BUSINESS");
    expect(metadata).toContain("reviewAfter");
    expect(metadata).not.toContain("Do not leak this need description");
    expect(metadata).not.toContain("Updated description");
    expect(metadata).not.toContain("note body must not leak");
  });

  it("creates, edits, and archives tenant-scoped capabilities safely", async () => {
    const data = await createOpportunityContext("capability-workflow@example.com");
    const capability = await createTenantCapability(data.context, {
      capabilityType: "EXPERIENCE",
      companyId: data.company.id,
      confidence: 0.68,
      description:
        "Do not leak this capability description into audit metadata.",
      noteId: data.note.id,
      personId: data.person.id,
      sensitivity: "NORMAL",
      title: "Delivered SE-CERT preparation",
    });

    await expect(
      getTenantCapabilityProfile(data.context, capability.id),
    ).resolves.toMatchObject({
      companyId: data.company.id,
      noteId: data.note.id,
      personId: data.person.id,
      tenantId: data.context.tenantId,
    });

    const updated = await updateTenantCapability(data.context, capability.id, {
      capabilityType: "SOLUTION",
      companyId: data.company.id,
      confidence: 0.9,
      description: "Updated capability description that should stay private.",
      noteId: data.note.id,
      personId: data.person.id,
      sensitivity: "SENSITIVE_BUSINESS",
      status: "PARKED",
      title: "Updated capability",
    });

    expect(updated).toMatchObject({
      capabilityType: "SOLUTION",
      status: "PARKED",
      title: "Updated capability",
    });

    const archived = await archiveTenantCapability(data.context, capability.id);

    expect(archived.archivedAt).toBeInstanceOf(Date);
    expect(archived.status).toBe("ARCHIVED");
    await expect(
      getTenantCapability(data.context, capability.id),
    ).resolves.toBeNull();

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "capability.created",
            "capability.updated",
            "capability.archived",
          ],
        },
        entityId: capability.id,
        tenantId: data.context.tenantId,
      },
    });
    const metadata = JSON.stringify(auditLogs.map((log) => log.metadata));

    expect(auditLogs).toHaveLength(3);
    expect(metadata).toContain(data.person.id);
    expect(metadata).toContain("SENSITIVE_BUSINESS");
    expect(metadata).not.toContain("Do not leak this capability description");
    expect(metadata).not.toContain("Updated capability description");
    expect(metadata).not.toContain("note body must not leak");
  });

  it("rejects cross-tenant reads, writes, and context links", async () => {
    const first = await createOpportunityContext("first-cross-opp@example.com");
    const second = await createOpportunityContext("second-cross-opp@example.com");
    const need = await createTenantNeed(first.context, {
      personId: first.person.id,
      title: "Tenant scoped need",
    });
    const capability = await createTenantCapability(first.context, {
      personId: first.person.id,
      title: "Tenant scoped capability",
    });

    await expect(getTenantNeed(second.context, need.id)).resolves.toBeNull();
    await expect(
      updateTenantNeed(second.context, need.id, {
        title: "Invalid update",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      createTenantNeed(first.context, {
        personId: second.person.id,
        title: "Invalid cross tenant need",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);

    await expect(
      getTenantCapability(second.context, capability.id),
    ).resolves.toBeNull();
    await expect(
      updateTenantCapability(second.context, capability.id, {
        title: "Invalid update",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      createTenantCapability(first.context, {
        companyId: second.company.id,
        title: "Invalid cross tenant capability",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("keeps opportunities hub summaries tenant-scoped", async () => {
    const first = await createOpportunityContext("first-hub-opp@example.com");
    const second = await createOpportunityContext("second-hub-opp@example.com");

    await createTenantNeed(first.context, {
      priority: "HIGH",
      title: "First tenant need",
    });
    await createTenantCapability(first.context, {
      title: "First tenant capability",
    });
    await createTenantNeed(second.context, {
      title: "Second tenant need",
    });
    await createTenantCapability(second.context, {
      title: "Second tenant capability",
    });

    const hub = await getTenantOpportunityHub(first.context);
    const needs = await listTenantNeedsWithContext(first.context);
    const capabilities = await listTenantCapabilitiesWithContext(first.context);

    expect(hub.counts.openNeeds).toBe(1);
    expect(hub.counts.activeCapabilities).toBe(1);
    expect(hub.latestNeeds.map((need) => need.title)).toContain(
      "First tenant need",
    );
    expect(hub.latestCapabilities.map((capability) => capability.title)).toContain(
      "First tenant capability",
    );
    expect(needs.map((need) => need.title)).not.toContain("Second tenant need");
    expect(capabilities.map((capability) => capability.title)).not.toContain(
      "Second tenant capability",
    );
  });
});
