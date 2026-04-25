import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type AIProposalsClient = PrismaClient | Prisma.TransactionClient;

const aiProposalListInclude = {
  _count: {
    select: {
      items: true,
    },
  },
  items: {
    select: {
      status: true,
    },
    where: {
      archivedAt: null,
    },
  },
  sourceMeeting: {
    select: {
      id: true,
      occurredAt: true,
      sourceType: true,
      title: true,
    },
  },
  sourceNote: {
    select: {
      id: true,
      noteType: true,
      sourceType: true,
      summary: true,
    },
  },
  sourceVoiceNote: {
    select: {
      id: true,
      status: true,
      title: true,
    },
  },
} satisfies Prisma.AIProposalInclude;

const aiProposalProfileInclude = {
  ...aiProposalListInclude,
  items: {
    orderBy: {
      createdAt: "asc",
    },
    where: {
      archivedAt: null,
    },
  },
} satisfies Prisma.AIProposalInclude;

export type AIProposalListRecord = Prisma.AIProposalGetPayload<{
  include: typeof aiProposalListInclude;
}>;

export type AIProposalProfileRecord = Prisma.AIProposalGetPayload<{
  include: typeof aiProposalProfileInclude;
}>;

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

export function findAIProposalProfileById(
  input: {
    tenantId: string;
    aiProposalId: string;
  },
  db: AIProposalsClient = prisma,
) {
  return db.aIProposal.findFirst({
    include: aiProposalProfileInclude,
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
    include: aiProposalListInclude,
    where: {
      tenantId,
      archivedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function updateAIProposalReviewState(
  input: {
    tenantId: string;
    aiProposalId: string;
    data: Prisma.AIProposalUncheckedUpdateInput;
  },
  db: AIProposalsClient = prisma,
) {
  return db.aIProposal.update({
    data: input.data,
    where: {
      id_tenantId: {
        id: input.aiProposalId,
        tenantId: input.tenantId,
      },
    },
  });
}

export function countPendingAIProposalsForTenant(
  tenantId: string,
  db: AIProposalsClient = prisma,
) {
  return db.aIProposal.count({
    where: {
      tenantId,
      archivedAt: null,
      status: {
        in: ["PENDING_REVIEW", "IN_REVIEW"],
      },
    },
  });
}
