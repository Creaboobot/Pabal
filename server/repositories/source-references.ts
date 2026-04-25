import {
  type Prisma,
  type PrismaClient,
  type SourceEntityType,
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type SourceReferencesClient = PrismaClient | Prisma.TransactionClient;

export function createSourceReference(
  input: {
    tenantId: string;
    data: Omit<Prisma.SourceReferenceUncheckedCreateInput, "tenantId">;
  },
  db: SourceReferencesClient = prisma,
) {
  return db.sourceReference.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function listSourceReferencesForTarget(
  input: {
    tenantId: string;
    targetEntityType: SourceEntityType;
    targetEntityId: string;
  },
  db: SourceReferencesClient = prisma,
) {
  return db.sourceReference.findMany({
    where: {
      tenantId: input.tenantId,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
