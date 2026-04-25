// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createTenantCapability } from "@/server/services/capabilities";
import { createTenantCommitment } from "@/server/services/commitments";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantIntroductionSuggestion } from "@/server/services/introduction-suggestions";
import { createTenantMeeting } from "@/server/services/meetings";
import { createTenantNeed } from "@/server/services/needs";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  archiveTenantTask,
  completeTenantTask,
  createTenantTask,
  getTenantTask,
  groupTaskBoard,
  listTenantTasksWithContext,
  reopenTenantTask,
  updateTenantTask,
} from "@/server/services/tasks";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

async function createTaskContext(email: string) {
  const context = await createTenantContext(email);
  const company = await createTenantCompany(context, {
    name: `${email} Company`,
  });
  const person = await createTenantPerson(context, {
    displayName: `${email} Person`,
  });
  const introductionTargetPerson = await createTenantPerson(context, {
    displayName: `${email} Introduction Target`,
  });
  const meeting = await createTenantMeeting(context, {
    primaryCompanyId: company.id,
    title: `${email} Meeting`,
  });
  const note = await createTenantNote(context, {
    body: `${email} note body`,
    companyId: company.id,
    meetingId: meeting.id,
    noteType: "MEETING",
    personId: person.id,
    summary: `${email} note summary`,
  });
  const commitment = await createTenantCommitment(context, {
    counterpartyCompanyId: company.id,
    counterpartyPersonId: person.id,
    meetingId: meeting.id,
    noteId: note.id,
    ownerType: "ME",
    title: `${email} Commitment`,
  });
  const need = await createTenantNeed(context, {
    companyId: company.id,
    needType: "REQUIREMENT",
    personId: person.id,
    title: `${email} Need`,
  });
  const capability = await createTenantCapability(context, {
    capabilityType: "EXPERIENCE",
    companyId: company.id,
    personId: person.id,
    title: `${email} Capability`,
  });
  const introductionSuggestion = await createTenantIntroductionSuggestion(
    context,
    {
      capabilityId: capability.id,
      fromPersonId: person.id,
      needId: need.id,
      rationale: "Manual relationship brokerage context.",
      toPersonId: introductionTargetPerson.id,
    },
  );

  return {
    commitment,
    company,
    context,
    introductionSuggestion,
    meeting,
    note,
    person,
  };
}

describeWithDatabase("task follow-up workflow", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates and safely links a task to supported tenant records", async () => {
    const data = await createTaskContext("linked-task@example.com");
    const task = await createTenantTask(data.context, {
      commitmentId: data.commitment.id,
      companyId: data.company.id,
      description: "Do not leak this description into audit metadata.",
      dueAt: new Date("2026-04-24T10:00:00.000Z"),
      introductionSuggestionId: data.introductionSuggestion.id,
      meetingId: data.meeting.id,
      noteId: data.note.id,
      personId: data.person.id,
      priority: "HIGH",
      taskType: "INTRODUCTION",
      title: "Follow up on introduction",
      whyNowRationale: "Do not leak this rationale into audit metadata.",
    });

    await expect(getTenantTask(data.context, task.id)).resolves.toMatchObject({
      commitmentId: data.commitment.id,
      companyId: data.company.id,
      introductionSuggestionId: data.introductionSuggestion.id,
      meetingId: data.meeting.id,
      noteId: data.note.id,
      personId: data.person.id,
      tenantId: data.context.tenantId,
    });

    const auditLog = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: "task.created",
        entityId: task.id,
        tenantId: data.context.tenantId,
      },
    });
    const metadata = JSON.stringify(auditLog.metadata);

    expect(metadata).toContain(data.person.id);
    expect(metadata).not.toContain("Do not leak this description");
    expect(metadata).not.toContain("Do not leak this rationale");
  });

  it("edits, completes, reopens, and archives a task", async () => {
    const data = await createTaskContext("task-lifecycle@example.com");
    const task = await createTenantTask(data.context, {
      title: "Initial title",
    });
    const updated = await updateTenantTask(data.context, task.id, {
      companyId: data.company.id,
      priority: "CRITICAL",
      taskType: "FOLLOW_UP",
      title: "Updated title",
    });

    expect(updated).toMatchObject({
      companyId: data.company.id,
      priority: "CRITICAL",
      title: "Updated title",
    });

    const completed = await completeTenantTask(data.context, task.id);

    expect(completed.status).toBe("DONE");
    expect(completed.completedAt).toBeInstanceOf(Date);

    const reopened = await reopenTenantTask(data.context, task.id);

    expect(reopened.status).toBe("OPEN");
    expect(reopened.completedAt).toBeNull();

    const archived = await archiveTenantTask(data.context, task.id);

    expect(archived.archivedAt).toBeInstanceOf(Date);
    await expect(getTenantTask(data.context, task.id)).resolves.toBeNull();
    await expect(
      prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              "task.updated",
              "task.completed",
              "task.reopened",
              "task.archived",
            ],
          },
          entityId: task.id,
          tenantId: data.context.tenantId,
        },
      }),
    ).resolves.toHaveLength(4);
  });

  it("rejects cross-tenant task reads, writes, and links", async () => {
    const first = await createTaskContext("first-cross-task@example.com");
    const second = await createTaskContext("second-cross-task@example.com");
    const task = await createTenantTask(first.context, {
      personId: first.person.id,
      title: "Tenant scoped task",
    });

    await expect(getTenantTask(second.context, task.id)).resolves.toBeNull();
    await expect(
      updateTenantTask(second.context, task.id, {
        title: "Invalid update",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      createTenantTask(first.context, {
        personId: second.person.id,
        title: "Invalid cross tenant link",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("keeps Today task board summaries tenant-scoped", async () => {
    const first = await createTaskContext("first-board@example.com");
    const second = await createTaskContext("second-board@example.com");
    const now = new Date("2026-04-24T10:00:00.000Z");
    const yesterday = new Date("2026-04-23T12:00:00.000Z");
    const today = new Date("2026-04-24T12:00:00.000Z");
    const nextWeek = new Date("2026-05-01T12:00:00.000Z");

    await createTenantTask(first.context, {
      dueAt: yesterday,
      title: "First overdue",
    });
    await createTenantTask(first.context, {
      dueAt: today,
      title: "First due today",
    });
    await createTenantTask(first.context, {
      dueAt: nextWeek,
      title: "First upcoming",
    });
    const completed = await createTenantTask(first.context, {
      title: "First completed",
    });
    await completeTenantTask(first.context, completed.id);
    await createTenantTask(second.context, {
      dueAt: yesterday,
      title: "Second tenant task",
    });

    const board = groupTaskBoard(
      await listTenantTasksWithContext(first.context),
      now,
    );

    expect(board.overdue.map((task) => task.title)).toContain("First overdue");
    expect(board.dueToday.map((task) => task.title)).toContain(
      "First due today",
    );
    expect(board.upcoming.map((task) => task.title)).toContain(
      "First upcoming",
    );
    expect(board.recentlyCompleted.map((task) => task.title)).toContain(
      "First completed",
    );
    expect(
      [
        ...board.overdue,
        ...board.dueToday,
        ...board.upcoming,
        ...board.recentlyCompleted,
      ].map((task) => task.title),
    ).not.toContain("Second tenant task");
  });
});
