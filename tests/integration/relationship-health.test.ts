// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createTenantAIProposal } from "@/server/services/ai-proposals";
import { createTenantCapability } from "@/server/services/capabilities";
import { createTenantCommitment } from "@/server/services/commitments";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantIntroductionSuggestion } from "@/server/services/introduction-suggestions";
import {
  createTenantMeeting,
  createTenantMeetingParticipant,
} from "@/server/services/meetings";
import { createTenantNeed } from "@/server/services/needs";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import {
  getTenantCompanyRelationshipHealth,
  getTenantPersonRelationshipHealth,
  getTenantRelationshipAttentionBoard,
} from "@/server/services/relationship-health";
import { createTenantTask } from "@/server/services/tasks";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

const now = new Date("2026-04-26T12:00:00.000Z");
const yesterday = new Date("2026-04-25T12:00:00.000Z");
const tomorrow = new Date("2026-04-27T12:00:00.000Z");
const eightyThreeDaysAgo = new Date("2026-02-02T12:00:00.000Z");

async function createRelationshipHealthContext(email: string) {
  const context = await createTenantContext(email);
  const company = await createTenantCompany(context, {
    name: `${email} Company`,
  });
  const person = await createTenantPerson(context, {
    displayName: `${email} Person`,
  });
  const targetPerson = await createTenantPerson(context, {
    displayName: `${email} Target Person`,
  });
  const meeting = await createTenantMeeting(context, {
    occurredAt: eightyThreeDaysAgo,
    primaryCompanyId: company.id,
    title: `${email} Meeting`,
  });

  await createTenantMeetingParticipant(context, {
    companyId: company.id,
    meetingId: meeting.id,
    personId: person.id,
  });

  const note = await createTenantNote(context, {
    body: `${email} note body`,
    companyId: company.id,
    meetingId: meeting.id,
    noteType: "MEETING",
    personId: person.id,
    summary: `${email} note summary`,
  });
  const need = await createTenantNeed(context, {
    companyId: company.id,
    meetingId: meeting.id,
    needType: "REQUIREMENT",
    noteId: note.id,
    personId: person.id,
    priority: "HIGH",
    title: `${email} Need`,
  });
  const capability = await createTenantCapability(context, {
    capabilityType: "EXPERIENCE",
    companyId: company.id,
    noteId: note.id,
    personId: person.id,
    title: `${email} Capability`,
  });
  const introductionSuggestion = await createTenantIntroductionSuggestion(
    context,
    {
      capabilityId: capability.id,
      fromPersonId: person.id,
      needId: need.id,
      rationale: "Manual introduction signal.",
      toPersonId: targetPerson.id,
    },
  );
  const task = await createTenantTask(context, {
    dueAt: yesterday,
    personId: person.id,
    priority: "HIGH",
    title: `${email} overdue task`,
  });
  const companyTask = await createTenantTask(context, {
    companyId: company.id,
    dueAt: tomorrow,
    priority: "MEDIUM",
    title: `${email} upcoming company task`,
  });
  const commitment = await createTenantCommitment(context, {
    counterpartyPersonId: person.id,
    dueAt: yesterday,
    ownerType: "ME",
    title: `${email} overdue commitment`,
  });
  const companyCommitment = await createTenantCommitment(context, {
    counterpartyCompanyId: company.id,
    dueAt: tomorrow,
    ownerType: "ME",
    title: `${email} upcoming company commitment`,
  });
  const proposal = await createTenantAIProposal(context, {
    proposalType: "RELATIONSHIP_UPDATE",
    targetEntityId: person.id,
    targetEntityType: "PERSON",
    title: `${email} pending proposal`,
  });

  return {
    capability,
    commitment,
    company,
    companyCommitment,
    companyTask,
    context,
    introductionSuggestion,
    meeting,
    need,
    note,
    person,
    proposal,
    task,
  };
}

describeWithDatabase("relationship health why-now signals", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("computes tenant-scoped person relationship health reasons", async () => {
    const data = await createRelationshipHealthContext("person-health@example.com");

    const health = await getTenantPersonRelationshipHealth(
      data.context,
      data.person.id,
      { now },
    );

    expect(health).toMatchObject({
      counts: {
        activeCapabilities: 1,
        activeIntroductions: 1,
        activeNeeds: 1,
        openCommitments: 1,
        openTasks: 1,
        pendingProposals: 1,
      },
      entityId: data.person.id,
      signal: "NEEDS_ATTENTION",
    });
    expect(health?.reasons.map((reason) => reason.type)).toEqual(
      expect.arrayContaining([
        "OVERDUE_TASK",
        "OVERDUE_COMMITMENT",
        "ACTIVE_NEED",
        "ACTIVE_CAPABILITY",
        "ACTIVE_INTRODUCTION",
        "PENDING_AI_PROPOSAL",
      ]),
    );
    expect(health?.reasons.every((reason) => reason.relatedEntityId)).toBe(
      true,
    );
  });

  it("computes tenant-scoped company relationship health reasons", async () => {
    const data = await createRelationshipHealthContext(
      "company-health@example.com",
    );

    const health = await getTenantCompanyRelationshipHealth(
      data.context,
      data.company.id,
      { now },
    );

    expect(health).toMatchObject({
      counts: {
        activeCapabilities: 1,
        activeNeeds: 1,
        openCommitments: 1,
        openTasks: 1,
      },
      entityId: data.company.id,
    });
    expect(health?.reasons.map((reason) => reason.type)).toEqual(
      expect.arrayContaining([
        "UPCOMING_TASK",
        "UPCOMING_COMMITMENT",
        "ACTIVE_NEED",
        "ACTIVE_CAPABILITY",
      ]),
    );
  });

  it("keeps the Today relationship attention board tenant-scoped", async () => {
    const first = await createRelationshipHealthContext(
      "first-attention@example.com",
    );
    const second = await createRelationshipHealthContext(
      "second-attention@example.com",
    );

    const board = await getTenantRelationshipAttentionBoard(first.context, {
      now,
    });

    expect(board.items.map((item) => item.entityId)).toContain(first.person.id);
    expect(board.items.map((item) => item.entityId)).toContain(
      first.company.id,
    );
    expect(board.items.map((item) => item.entityId)).not.toContain(
      second.person.id,
    );
    expect(board.items.map((item) => item.entityId)).not.toContain(
      second.company.id,
    );
  });

  it("returns null for cross-tenant person and company signals", async () => {
    const first = await createRelationshipHealthContext(
      "first-cross-health@example.com",
    );
    const second = await createRelationshipHealthContext(
      "second-cross-health@example.com",
    );

    await expect(
      getTenantPersonRelationshipHealth(second.context, first.person.id, {
        now,
      }),
    ).resolves.toBeNull();
    await expect(
      getTenantCompanyRelationshipHealth(second.context, first.company.id, {
        now,
      }),
    ).resolves.toBeNull();
  });

  it("does not mutate records or write audit logs while computing signals", async () => {
    const data = await createRelationshipHealthContext(
      "read-only-health@example.com",
    );
    const before = {
      auditLogs: await prisma.auditLog.count({
        where: { tenantId: data.context.tenantId },
      }),
      companies: await prisma.company.count({
        where: { tenantId: data.context.tenantId },
      }),
      people: await prisma.person.count({
        where: { tenantId: data.context.tenantId },
      }),
      tasks: await prisma.task.count({
        where: { tenantId: data.context.tenantId },
      }),
    };

    await getTenantPersonRelationshipHealth(data.context, data.person.id, {
      now,
    });
    await getTenantCompanyRelationshipHealth(data.context, data.company.id, {
      now,
    });
    await getTenantRelationshipAttentionBoard(data.context, { now });

    await expect(
      prisma.auditLog.count({ where: { tenantId: data.context.tenantId } }),
    ).resolves.toBe(before.auditLogs);
    await expect(
      prisma.company.count({ where: { tenantId: data.context.tenantId } }),
    ).resolves.toBe(before.companies);
    await expect(
      prisma.person.count({ where: { tenantId: data.context.tenantId } }),
    ).resolves.toBe(before.people);
    await expect(
      prisma.task.count({ where: { tenantId: data.context.tenantId } }),
    ).resolves.toBe(before.tasks);
  });
});
