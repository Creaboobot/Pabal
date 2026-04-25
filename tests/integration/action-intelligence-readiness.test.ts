// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { seedActionIntelligenceDemoData } from "@/prisma/seed-data/action-intelligence";
import { prisma } from "@/server/db/prisma";
import { createIntroductionSuggestion } from "@/server/repositories/introduction-suggestions";
import { createTask } from "@/server/repositories/tasks";
import { createTenantCapability } from "@/server/services/capabilities";
import { createTenantCommitment } from "@/server/services/commitments";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantIntroductionSuggestion } from "@/server/services/introduction-suggestions";
import { createTenantMeeting } from "@/server/services/meetings";
import { createTenantNeed } from "@/server/services/needs";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import {
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import { createTenantSourceReference } from "@/server/services/source-references";
import {
  createTenantTask,
  getTenantTask,
  listTenantTasks,
} from "@/server/services/tasks";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

async function createRelationshipContext(email: string) {
  const context = await createTenantContext(email);
  const company = await createTenantCompany(context, {
    name: `${email} Company`,
  });
  const person = await createTenantPerson(context, {
    displayName: `${email} Person`,
  });
  const meeting = await createTenantMeeting(context, {
    title: `${email} Meeting`,
    primaryCompanyId: company.id,
  });
  const note = await createTenantNote(context, {
    body: `${email} note body`,
    companyId: company.id,
    meetingId: meeting.id,
    personId: person.id,
    noteType: "MEETING",
  });

  return {
    context,
    company,
    person,
    meeting,
    note,
  };
}

describeWithDatabase("action and intelligence readiness tenant isolation", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates and isolates tenant-scoped tasks", async () => {
    const first = await createRelationshipContext("first-task@example.com");
    const second = await createRelationshipContext("second-task@example.com");
    const task = await createTenantTask(first.context, {
      title: "Follow up on MBSE agenda",
      priority: "HIGH",
      taskType: "FOLLOW_UP",
      personId: first.person.id,
      companyId: first.company.id,
      meetingId: first.meeting.id,
      noteId: first.note.id,
      whyNowRationale: "The meeting produced a concrete follow-up.",
      confidence: 0.86,
    });

    await expect(getTenantTask(first.context, task.id)).resolves.toMatchObject({
      id: task.id,
      tenantId: first.context.tenantId,
    });
    await expect(getTenantTask(second.context, task.id)).resolves.toBeNull();
    await expect(listTenantTasks(first.context)).resolves.toHaveLength(1);
    await expect(listTenantTasks(second.context)).resolves.toHaveLength(0);
  });

  it("creates and isolates tenant-scoped commitments", async () => {
    const first = await createRelationshipContext("first-commitment@example.com");
    const second = await createRelationshipContext("second-commitment@example.com");
    const commitment = await createTenantCommitment(first.context, {
      ownerType: "ME",
      counterpartyPersonId: first.person.id,
      counterpartyCompanyId: first.company.id,
      title: "Send practical training outline",
      status: "OPEN",
      meetingId: first.meeting.id,
      noteId: first.note.id,
    });

    await expect(
      prisma.commitment.findFirst({
        where: {
          id: commitment.id,
          tenantId: first.context.tenantId,
          archivedAt: null,
        },
      }),
    ).resolves.toMatchObject({
      id: commitment.id,
    });
    await expect(
      prisma.commitment.findFirst({
        where: {
          id: commitment.id,
          tenantId: second.context.tenantId,
          archivedAt: null,
        },
      }),
    ).resolves.toBeNull();
  });

  it("creates and isolates tenant-scoped needs and capabilities", async () => {
    const first = await createRelationshipContext("first-intelligence@example.com");
    const second = await createRelationshipContext("second-intelligence@example.com");
    const need = await createTenantNeed(first.context, {
      title: "Need practical MBSE examples",
      description: "The team wants concrete examples instead of theory.",
      needType: "REQUIREMENT",
      priority: "HIGH",
      personId: first.person.id,
      companyId: first.company.id,
      meetingId: first.meeting.id,
      noteId: first.note.id,
      confidence: 0.9,
    });
    const capability = await createTenantCapability(first.context, {
      title: "Can shape MBSE training agenda",
      description: "Relevant experience preparing training outlines.",
      capabilityType: "EXPERIENCE",
      personId: first.person.id,
      companyId: first.company.id,
      noteId: first.note.id,
      confidence: 0.82,
    });

    await expect(
      prisma.need.findFirst({
        where: { id: need.id, tenantId: second.context.tenantId },
      }),
    ).resolves.toBeNull();
    await expect(
      prisma.capability.findFirst({
        where: { id: capability.id, tenantId: second.context.tenantId },
      }),
    ).resolves.toBeNull();
  });

  it("rejects cross-tenant direct task relations at the database layer", async () => {
    const first = await createRelationshipContext("first-task-db@example.com");
    const second = await createRelationshipContext("second-task-db@example.com");

    await expect(
      createTask({
        tenantId: first.context.tenantId,
        data: {
          title: "Invalid cross-tenant task",
          personId: second.person.id,
          createdByUserId: first.context.userId,
          updatedByUserId: first.context.userId,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects cross-tenant introduction suggestions", async () => {
    const first = await createRelationshipContext("first-intro@example.com");
    const second = await createRelationshipContext("second-intro@example.com");
    const need = await createTenantNeed(first.context, {
      title: "Find MBSE training help",
      needType: "REQUIREMENT",
      personId: first.person.id,
    });
    const capability = await createTenantCapability(second.context, {
      title: "Can help with training",
      capabilityType: "EXPERIENCE",
      personId: second.person.id,
    });

    await expect(
      createTenantIntroductionSuggestion(first.context, {
        needId: need.id,
        capabilityId: capability.id,
        fromPersonId: second.person.id,
        toPersonId: first.person.id,
        rationale: "Should fail because the capability and person are outside the tenant.",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);

    await expect(
      createIntroductionSuggestion({
        tenantId: first.context.tenantId,
        data: {
          needId: need.id,
          capabilityId: capability.id,
          rationale: "Database should reject the cross-tenant capability link.",
          createdByUserId: first.context.userId,
          updatedByUserId: first.context.userId,
        },
      }),
    ).rejects.toThrow();
  });

  it("prevents SourceReference links across Step 4B-1 tenants", async () => {
    const first = await createRelationshipContext("first-source-4b1@example.com");
    const second = await createRelationshipContext("second-source-4b1@example.com");
    const need = await createTenantNeed(first.context, {
      title: "Need a practical training outline",
      needType: "REQUIREMENT",
      personId: first.person.id,
    });
    const capability = await createTenantCapability(second.context, {
      title: "Can help with the training outline",
      capabilityType: "EXPERIENCE",
      personId: second.person.id,
    });

    await expect(
      createTenantSourceReference(first.context, {
        sourceEntityType: "NEED",
        sourceEntityId: need.id,
        targetEntityType: "CAPABILITY",
        targetEntityId: capability.id,
        label: "invalid-cross-tenant-readiness-link",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("seeds Step 4B-1 demo data idempotently", async () => {
    await seedActionIntelligenceDemoData(prisma);
    await seedActionIntelligenceDemoData(prisma);

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: "demo-workspace" },
    });

    await expect(
      prisma.task.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(1);
    await expect(
      prisma.commitment.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(1);
    await expect(
      prisma.need.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(1);
    await expect(
      prisma.capability.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(1);
    await expect(
      prisma.introductionSuggestion.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(1);
    await expect(
      prisma.sourceReference.count({
        where: {
          tenantId: tenant.id,
          targetEntityType: {
            in: [
              "TASK",
              "COMMITMENT",
              "NEED",
              "CAPABILITY",
              "INTRODUCTION_SUGGESTION",
            ],
          },
        },
      }),
    ).resolves.toBe(5);
  });
});
