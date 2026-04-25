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

export function findCompanyProfileById(
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
    include: {
      companyAffiliations: {
        where: {
          archivedAt: null,
        },
        include: {
          person: true,
        },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      },
      _count: {
        select: {
          notes: true,
          primaryMeetings: true,
        },
      },
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

export function listCompaniesForTenantWithProfiles(
  tenantId: string,
  db: CompaniesClient = prisma,
) {
  return db.company.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    include: {
      companyAffiliations: {
        where: {
          archivedAt: null,
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function updateCompany(
  input: {
    tenantId: string;
    companyId: string;
    data: Prisma.CompanyUncheckedUpdateInput;
  },
  db: CompaniesClient = prisma,
) {
  return db.company.update({
    where: {
      id_tenantId: {
        id: input.companyId,
        tenantId: input.tenantId,
      },
    },
    data: input.data,
  });
}
