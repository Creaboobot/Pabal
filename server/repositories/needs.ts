import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type NeedsClient = PrismaClient | Prisma.TransactionClient;

const needContextInclude = {
  company: {
    select: {
      id: true,
      name: true,
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
} satisfies Prisma.NeedInclude;

export type NeedWithContext = Prisma.NeedGetPayload<{
  include: typeof needContextInclude;
}>;

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

export function updateNeed(
  input: {
    tenantId: string;
    needId: string;
    data: Prisma.NeedUncheckedUpdateInput;
  },
  db: NeedsClient = prisma,
) {
  return db.need.update({
    where: {
      id_tenantId: {
        id: input.needId,
        tenantId: input.tenantId,
      },
    },
    data: input.data,
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

export function findNeedProfileById(
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
    include: needContextInclude,
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

export function listNeedsForTenantWithContext(
  tenantId: string,
  db: NeedsClient = prisma,
) {
  return db.need.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    include: needContextInclude,
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });
}
