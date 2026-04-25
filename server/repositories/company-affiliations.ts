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

export function findCompanyAffiliationForPerson(
  input: {
    tenantId: string;
    personId: string;
    companyAffiliationId: string;
  },
  db: CompanyAffiliationsClient = prisma,
) {
  return db.companyAffiliation.findFirst({
    where: {
      id: input.companyAffiliationId,
      personId: input.personId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
    include: {
      company: true,
      person: true,
    },
  });
}

export function updateCompanyAffiliation(
  input: {
    tenantId: string;
    companyAffiliationId: string;
    data: Prisma.CompanyAffiliationUncheckedUpdateInput;
  },
  db: CompanyAffiliationsClient = prisma,
) {
  return db.companyAffiliation.update({
    where: {
      id_tenantId: {
        id: input.companyAffiliationId,
        tenantId: input.tenantId,
      },
    },
    data: input.data,
  });
}

export function unsetOtherPrimaryCompanyAffiliations(
  input: {
    tenantId: string;
    personId: string;
    companyAffiliationId?: string;
    now?: Date;
  },
  db: CompanyAffiliationsClient = prisma,
) {
  const now = input.now ?? new Date();

  return db.companyAffiliation.updateMany({
    where: {
      tenantId: input.tenantId,
      personId: input.personId,
      archivedAt: null,
      isPrimary: true,
      ...(input.companyAffiliationId
        ? {
            id: {
              not: input.companyAffiliationId,
            },
          }
        : {}),
      OR: [
        {
          endsAt: null,
        },
        {
          endsAt: {
            gt: now,
          },
        },
      ],
    },
    data: {
      isPrimary: false,
    },
  });
}
