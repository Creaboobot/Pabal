import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type CommitmentsClient = PrismaClient | Prisma.TransactionClient;

const commitmentContextInclude = {
  counterpartyCompany: {
    select: {
      id: true,
      name: true,
    },
  },
  counterpartyPerson: {
    select: {
      displayName: true,
      id: true,
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
  ownerCompany: {
    select: {
      id: true,
      name: true,
    },
  },
  ownerPerson: {
    select: {
      displayName: true,
      id: true,
    },
  },
  tasks: {
    where: {
      archivedAt: null,
    },
    select: {
      dueAt: true,
      id: true,
      priority: true,
      status: true,
      taskType: true,
      title: true,
    },
    orderBy: [
      { dueAt: "asc" },
      { createdAt: "desc" },
    ],
  },
} satisfies Prisma.CommitmentInclude;

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

export function updateCommitment(
  input: {
    tenantId: string;
    commitmentId: string;
    data: Prisma.CommitmentUncheckedUpdateInput;
  },
  db: CommitmentsClient = prisma,
) {
  return db.commitment.update({
    where: {
      id_tenantId: {
        id: input.commitmentId,
        tenantId: input.tenantId,
      },
    },
    data: input.data,
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

export function findCommitmentProfileById(
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
    include: commitmentContextInclude,
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

export function listCommitmentsForTenantWithContext(
  tenantId: string,
  db: CommitmentsClient = prisma,
) {
  return db.commitment.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    include: commitmentContextInclude,
    orderBy: [
      { dueAt: "asc" },
      { dueWindowEnd: "asc" },
      { createdAt: "desc" },
    ],
  });
}
