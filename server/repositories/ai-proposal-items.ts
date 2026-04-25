import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type AIProposalItemsClient = PrismaClient | Prisma.TransactionClient;

export function createAIProposalItem(
  input: {
    tenantId: string;
    data: Omit<Prisma.AIProposalItemUncheckedCreateInput, "tenantId">;
  },
  db: AIProposalItemsClient = prisma,
) {
  return db.aIProposalItem.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findAIProposalItemById(
  input: {
    tenantId: string;
    aiProposalItemId: string;
  },
  db: AIProposalItemsClient = prisma,
) {
  return db.aIProposalItem.findFirst({
    where: {
      id: input.aiProposalItemId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function listAIProposalItemsForProposal(
  input: {
    tenantId: string;
    aiProposalId: string;
  },
  db: AIProposalItemsClient = prisma,
) {
  return db.aIProposalItem.findMany({
    where: {
      tenantId: input.tenantId,
      aiProposalId: input.aiProposalId,
      archivedAt: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
