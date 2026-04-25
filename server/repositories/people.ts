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
