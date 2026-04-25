import {
  type Prisma,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  createTask,
  findTaskById,
  findTaskProfileById,
  listTasksForTenant,
  listTasksForTenantWithContext,
  updateTask,
} from "@/server/repositories/tasks";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  assertOptionalRelationshipEntityBelongsToTenant,
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export type TaskMutationInput = {
  commitmentId?: string | null;
  companyId?: string | null;
  description?: string | null;
  dueAt?: Date | null;
  introductionSuggestionId?: string | null;
  meetingId?: string | null;
  noteId?: string | null;
  personId?: string | null;
  priority?: TaskPriority;
  reminderAt?: Date | null;
  snoozedUntil?: Date | null;
  status?: TaskStatus;
  taskType?: TaskType;
  title: string;
  whyNowRationale?: string | null;
  confidence?: number | null;
};

type TaskBoardTask = Awaited<
  ReturnType<typeof listTasksForTenantWithContext>
>[number];

const OPEN_TASK_STATUSES: TaskStatus[] = ["OPEN", "SNOOZED"];

function startOfDay(value: Date) {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return day;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function taskAuditMetadata(
  task: {
    commitmentId: string | null;
    companyId: string | null;
    dueAt: Date | null;
    id: string;
    introductionSuggestionId: string | null;
    meetingId: string | null;
    noteId: string | null;
    personId: string | null;
    priority: TaskPriority;
    reminderAt: Date | null;
    snoozedUntil: Date | null;
    status: TaskStatus;
    taskType: TaskType;
  },
  extra?: Record<string, unknown>,
) {
  return {
    commitmentId: task.commitmentId,
    companyId: task.companyId,
    hasDueDate: Boolean(task.dueAt),
    hasReminderDate: Boolean(task.reminderAt),
    hasSnoozeDate: Boolean(task.snoozedUntil),
    introductionSuggestionId: task.introductionSuggestionId,
    meetingId: task.meetingId,
    noteId: task.noteId,
    personId: task.personId,
    priority: task.priority,
    status: task.status,
    taskId: task.id,
    taskType: task.taskType,
    ...extra,
  };
}

async function validateTaskLinks(
  context: TenantContext,
  data: {
    commitmentId?: string | null;
    companyId?: string | null;
    introductionSuggestionId?: string | null;
    meetingId?: string | null;
    noteId?: string | null;
    personId?: string | null;
  },
  db: Prisma.TransactionClient,
) {
  await Promise.all([
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "PERSON",
        entityId: data.personId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "COMPANY",
        entityId: data.companyId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "MEETING",
        entityId: data.meetingId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "NOTE",
        entityId: data.noteId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "COMMITMENT",
        entityId: data.commitmentId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "INTRODUCTION_SUGGESTION",
        entityId: data.introductionSuggestionId,
      },
      db,
    ),
  ]);
}

export async function createTenantTask(
  context: TenantContext,
  data: TaskMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    await validateTaskLinks(context, data, tx);

    const task = await createTask(
      {
        tenantId: context.tenantId,
        data: {
          ...data,
          createdByUserId: context.userId,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "task.created",
        entityType: "Task",
        entityId: task.id,
        metadata: taskAuditMetadata(task, {
          source: "manual-form",
        }),
      },
      tx,
    );

    return task;
  });
}

export async function getTenantTask(context: TenantContext, taskId: string) {
  await requireTenantAccess(context);

  return findTaskById({
    tenantId: context.tenantId,
    taskId,
  });
}

export async function getTenantTaskProfile(
  context: TenantContext,
  taskId: string,
) {
  await requireTenantAccess(context);

  return findTaskProfileById({
    tenantId: context.tenantId,
    taskId,
  });
}

export async function listTenantTasks(context: TenantContext) {
  await requireTenantAccess(context);

  return listTasksForTenant(context.tenantId);
}

export async function listTenantTasksWithContext(context: TenantContext) {
  await requireTenantAccess(context);

  return listTasksForTenantWithContext(context.tenantId);
}

export async function updateTenantTask(
  context: TenantContext,
  taskId: string,
  data: TaskMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findTaskById(
      {
        tenantId: context.tenantId,
        taskId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("TASK", taskId);
    }

    await validateTaskLinks(context, data, tx);

    const changedFields = Object.keys(data).filter(
      (field) => data[field as keyof typeof data] !== undefined,
    );
    const task = await updateTask(
      {
        tenantId: context.tenantId,
        taskId,
        data: {
          ...data,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "task.updated",
        entityType: "Task",
        entityId: task.id,
        metadata: taskAuditMetadata(task, {
          changedFields,
        }),
      },
      tx,
    );

    return task;
  });
}

export async function completeTenantTask(
  context: TenantContext,
  taskId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findTaskById(
      {
        tenantId: context.tenantId,
        taskId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("TASK", taskId);
    }

    const task = await updateTask(
      {
        tenantId: context.tenantId,
        taskId,
        data: {
          completedAt: new Date(),
          status: "DONE",
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "task.completed",
        entityType: "Task",
        entityId: task.id,
        metadata: taskAuditMetadata(task),
      },
      tx,
    );

    return task;
  });
}

export async function reopenTenantTask(
  context: TenantContext,
  taskId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findTaskById(
      {
        tenantId: context.tenantId,
        taskId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("TASK", taskId);
    }

    const task = await updateTask(
      {
        tenantId: context.tenantId,
        taskId,
        data: {
          completedAt: null,
          status: "OPEN",
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "task.reopened",
        entityType: "Task",
        entityId: task.id,
        metadata: taskAuditMetadata(task),
      },
      tx,
    );

    return task;
  });
}

export async function archiveTenantTask(
  context: TenantContext,
  taskId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findTaskById(
      {
        tenantId: context.tenantId,
        taskId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("TASK", taskId);
    }

    const task = await updateTask(
      {
        tenantId: context.tenantId,
        taskId,
        data: {
          archivedAt: new Date(),
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "task.archived",
        entityType: "Task",
        entityId: task.id,
        metadata: taskAuditMetadata(task, {
          source: "manual-form",
        }),
      },
      tx,
    );

    return task;
  });
}

function isOpenTask(task: TaskBoardTask) {
  return OPEN_TASK_STATUSES.includes(task.status);
}

export function groupTaskBoard(tasks: TaskBoardTask[], now = new Date()) {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  return {
    dueToday: tasks.filter(
      (task) =>
        isOpenTask(task) &&
        task.dueAt !== null &&
        task.dueAt >= now &&
        task.dueAt < tomorrow,
    ),
    openWithoutDue: tasks.filter((task) => isOpenTask(task) && !task.dueAt),
    overdue: tasks.filter(
      (task) =>
        isOpenTask(task) && task.dueAt !== null && task.dueAt < now,
    ),
    recentlyCompleted: tasks
      .filter((task) => task.status === "DONE" && task.completedAt !== null)
      .sort((first, second) => {
        return (
          (second.completedAt?.getTime() ?? 0) -
          (first.completedAt?.getTime() ?? 0)
        );
      })
      .slice(0, 5),
    upcoming: tasks.filter(
      (task) =>
        isOpenTask(task) &&
        task.dueAt !== null &&
        task.dueAt >= tomorrow,
    ),
  };
}

export async function getTenantTaskBoard(context: TenantContext) {
  const tasks = await listTenantTasksWithContext(context);

  return groupTaskBoard(tasks);
}
