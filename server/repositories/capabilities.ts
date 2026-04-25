import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type CapabilitiesClient = PrismaClient | Prisma.TransactionClient;

const capabilityContextInclude = {
  company: {
    select: {
      id: true,
      name: true,
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
} satisfies Prisma.CapabilityInclude;

export type CapabilityWithContext = Prisma.CapabilityGetPayload<{
  include: typeof capabilityContextInclude;
}>;

export function createCapability(
  input: {
    tenantId: string;
    data: Omit<Prisma.CapabilityUncheckedCreateInput, "tenantId">;
  },
  db: CapabilitiesClient = prisma,
) {
  return db.capability.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function updateCapability(
  input: {
    tenantId: string;
    capabilityId: string;
    data: Prisma.CapabilityUncheckedUpdateInput;
  },
  db: CapabilitiesClient = prisma,
) {
  return db.capability.update({
    where: {
      id_tenantId: {
        id: input.capabilityId,
        tenantId: input.tenantId,
      },
    },
    data: input.data,
  });
}

export function findCapabilityById(
  input: {
    tenantId: string;
    capabilityId: string;
  },
  db: CapabilitiesClient = prisma,
) {
  return db.capability.findFirst({
    where: {
      id: input.capabilityId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function findCapabilityProfileById(
  input: {
    tenantId: string;
    capabilityId: string;
  },
  db: CapabilitiesClient = prisma,
) {
  return db.capability.findFirst({
    where: {
      id: input.capabilityId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
    include: capabilityContextInclude,
  });
}

export function listCapabilitiesForTenant(
  tenantId: string,
  db: CapabilitiesClient = prisma,
) {
  return db.capability.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function listCapabilitiesForTenantWithContext(
  tenantId: string,
  db: CapabilitiesClient = prisma,
) {
  return db.capability.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    include: capabilityContextInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}
