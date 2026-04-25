import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type CompaniesClient = PrismaClient | Prisma.TransactionClient;

export function createCompany(
  input: {
    tenantId: string;
    data: Omit<Prisma.CompanyUncheckedCreateInput, "tenantId">;
  },
  db: CompaniesClient = prisma,
) {
  return db.company.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findCompanyById(
  input: {
    tenantId: string;
    companyId: string;
  },
  db: CompaniesClient = prisma,
) {
  return db.company.findFirst({
    where: {
      id: input.companyId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function listCompaniesForTenant(
  tenantId: string,
  db: CompaniesClient = prisma,
) {
  return db.company.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    orderBy: {
      name: "asc",
    },
  });
}
