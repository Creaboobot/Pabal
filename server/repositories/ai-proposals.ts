import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type AIProposalsClient = PrismaClient | Prisma.TransactionClient;

export function createAIProposal(
  input: {
    tenantId: string;
    data: Omit<Prisma.AIProposalUncheckedCreateInput, "tenantId">;
  },
  db: AIProposalsClient = prisma,
) {
  return db.aIProposal.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findAIProposalById(
  input: {
    tenantId: string;
    aiProposalId: string;
  },
  db: AIProposalsClient = prisma,
) {
  return db.aIProposal.findFirst({
    where: {
      id: input.aiProposalId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function listAIProposalsForTenant(
  tenantId: string,
  db: AIProposalsClient = prisma,
) {
  return db.aIProposal.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
