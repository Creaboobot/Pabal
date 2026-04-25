import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type CompanyAffiliationsClient = PrismaClient | Prisma.TransactionClient;

export function createCompanyAffiliation(
  input: {
    tenantId: string;
    data: Omit<Prisma.CompanyAffiliationUncheckedCreateInput, "tenantId">;
  },
  db: CompanyAffiliationsClient = prisma,
) {
  return db.companyAffiliation.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findCompanyAffiliationById(
  input: {
    tenantId: string;
    companyAffiliationId: string;
  },
  db: CompanyAffiliationsClient = prisma,
) {
  return db.companyAffiliation.findFirst({
    where: {
      id: input.companyAffiliationId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}
