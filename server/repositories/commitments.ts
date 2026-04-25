import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type CommitmentsClient = PrismaClient | Prisma.TransactionClient;

export function createCommitment(
  input: {
    tenantId: string;
    data: Omit<Prisma.CommitmentUncheckedCreateInput, "tenantId">;
  },
  db: CommitmentsClient = prisma,
) {
  return db.commitment.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findCommitmentById(
  input: {
    tenantId: string;
    commitmentId: string;
  },
  db: CommitmentsClient = prisma,
) {
  return db.commitment.findFirst({
    where: {
      id: input.commitmentId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function listCommitmentsForTenant(
  tenantId: string,
  db: CommitmentsClient = prisma,
) {
  return db.commitment.findMany({
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
