import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type CapabilitiesClient = PrismaClient | Prisma.TransactionClient;

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
