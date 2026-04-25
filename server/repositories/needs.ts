import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type NeedsClient = PrismaClient | Prisma.TransactionClient;

export function createNeed(
  input: {
    tenantId: string;
    data: Omit<Prisma.NeedUncheckedCreateInput, "tenantId">;
  },
  db: NeedsClient = prisma,
) {
  return db.need.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findNeedById(
  input: {
    tenantId: string;
    needId: string;
  },
  db: NeedsClient = prisma,
) {
  return db.need.findFirst({
    where: {
      id: input.needId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function listNeedsForTenant(
  tenantId: string,
  db: NeedsClient = prisma,
) {
  return db.need.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });
}
