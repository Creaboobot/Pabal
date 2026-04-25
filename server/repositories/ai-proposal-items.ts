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

export function findAIProposalItemForProposal(
  input: {
    tenantId: string;
    aiProposalId: string;
    aiProposalItemId: string;
  },
  db: AIProposalItemsClient = prisma,
) {
  return db.aIProposalItem.findFirst({
    where: {
      id: input.aiProposalItemId,
      aiProposalId: input.aiProposalId,
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

export function updateAIProposalItemReviewState(
  input: {
    tenantId: string;
    aiProposalItemId: string;
    data: Prisma.AIProposalItemUncheckedUpdateInput;
  },
  db: AIProposalItemsClient = prisma,
) {
  return db.aIProposalItem.update({
    data: input.data,
    where: {
      id_tenantId: {
        id: input.aiProposalItemId,
        tenantId: input.tenantId,
      },
    },
  });
}

export function updatePendingAIProposalItemsForProposal(
  input: {
    tenantId: string;
    aiProposalId: string;
    data: Prisma.AIProposalItemUncheckedUpdateInput;
  },
  db: AIProposalItemsClient = prisma,
) {
  return db.aIProposalItem.updateMany({
    data: input.data,
    where: {
      aiProposalId: input.aiProposalId,
      archivedAt: null,
      status: "PENDING_REVIEW",
      tenantId: input.tenantId,
    },
  });
}

export function countAIProposalItemsNeedingClarificationForTenant(
  tenantId: string,
  db: AIProposalItemsClient = prisma,
) {
  return db.aIProposalItem.count({
    where: {
      tenantId,
      archivedAt: null,
      status: "NEEDS_CLARIFICATION",
      aiProposal: {
        archivedAt: null,
        status: {
          not: "DISMISSED",
        },
      },
    },
  });
}
