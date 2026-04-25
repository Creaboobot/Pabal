import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type TasksClient = PrismaClient | Prisma.TransactionClient;

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
