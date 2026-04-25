import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type TasksClient = PrismaClient | Prisma.TransactionClient;

const taskContextInclude = {
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  commitment: {
    select: {
      dueAt: true,
      id: true,
      status: true,
      title: true,
    },
  },
  introductionSuggestion: {
    select: {
      id: true,
      rationale: true,
      status: true,
    },
  },
  meeting: {
    select: {
      id: true,
      occurredAt: true,
      title: true,
    },
  },
  note: {
    select: {
      id: true,
      noteType: true,
      sensitivity: true,
      sourceType: true,
      summary: true,
    },
  },
  person: {
    select: {
      displayName: true,
      id: true,
    },
  },
} satisfies Prisma.TaskInclude;

export function createTask(
  input: {
    tenantId: string;
    data: Omit<Prisma.TaskUncheckedCreateInput, "tenantId">;
  },
  db: TasksClient = prisma,
) {
  return db.task.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function updateTask(
  input: {
    tenantId: string;
    taskId: string;
    data: Prisma.TaskUncheckedUpdateInput;
  },
  db: TasksClient = prisma,
) {
  return db.task.update({
    where: {
      id_tenantId: {
        id: input.taskId,
        tenantId: input.tenantId,
      },
    },
    data: input.data,
  });
}

export function findTaskById(
  input: {
    tenantId: string;
    taskId: string;
  },
  db: TasksClient = prisma,
) {
  return db.task.findFirst({
    where: {
      id: input.taskId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function findTaskProfileById(
  input: {
    tenantId: string;
    taskId: string;
  },
  db: TasksClient = prisma,
) {
  return db.task.findFirst({
    where: {
      id: input.taskId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
    include: taskContextInclude,
  });
}

export function listTasksForTenant(
  tenantId: string,
  db: TasksClient = prisma,
) {
  return db.task.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    orderBy: [
      { dueAt: "asc" },
      { createdAt: "desc" },
    ],
  });
}

export function listTasksForTenantWithContext(
  tenantId: string,
  db: TasksClient = prisma,
) {
  return db.task.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    include: taskContextInclude,
    orderBy: [
      { dueAt: "asc" },
      { createdAt: "desc" },
    ],
  });
}
