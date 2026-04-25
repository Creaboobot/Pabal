import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type MembershipClient = PrismaClient | Prisma.TransactionClient;

export function findActiveMembershipForUser(
  input: {
    tenantId: string;
    userId: string;
  },
  db: MembershipClient = prisma,
) {
  return db.membership.findFirst({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      status: "ACTIVE",
    },
    include: {
      role: true,
      tenant: true,
    },
  });
}

export function findFirstActiveMembershipForUser(
  userId: string,
  db: MembershipClient = prisma,
) {
  return db.membership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: {
      role: true,
      tenant: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
