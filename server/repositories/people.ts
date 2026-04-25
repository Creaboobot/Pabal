import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type PeopleClient = PrismaClient | Prisma.TransactionClient;

export function createPerson(
  input: {
    tenantId: string;
    data: Omit<Prisma.PersonUncheckedCreateInput, "tenantId">;
  },
  db: PeopleClient = prisma,
) {
  return db.person.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findPersonById(
  input: {
    tenantId: string;
    personId: string;
  },
  db: PeopleClient = prisma,
) {
  return db.person.findFirst({
    where: {
      id: input.personId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function findPersonProfileById(
  input: {
    tenantId: string;
    personId: string;
  },
  db: PeopleClient = prisma,
) {
  return db.person.findFirst({
    where: {
      id: input.personId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
    include: {
      companyAffiliations: {
        where: {
          archivedAt: null,
        },
        include: {
          company: true,
        },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      },
      _count: {
        select: {
          meetingParticipants: true,
          notes: true,
        },
      },
    },
  });
}

export function listPeopleForTenant(
  tenantId: string,
  db: PeopleClient = prisma,
) {
  return db.person.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    orderBy: {
      displayName: "asc",
    },
  });
}

export function listPeopleForTenantWithProfiles(
  tenantId: string,
  db: PeopleClient = prisma,
) {
  return db.person.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    include: {
      companyAffiliations: {
        where: {
          archivedAt: null,
        },
        include: {
          company: true,
        },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      },
    },
    orderBy: {
      displayName: "asc",
    },
  });
}

export async function updatePerson(
  input: {
    tenantId: string;
    personId: string;
    data: Prisma.PersonUncheckedUpdateInput;
  },
  db: PeopleClient = prisma,
) {
  return db.person.update({
    where: {
      id_tenantId: {
        id: input.personId,
        tenantId: input.tenantId,
      },
    },
    data: input.data,
  });
}
