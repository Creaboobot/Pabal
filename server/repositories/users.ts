import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type UserClient = PrismaClient | Prisma.TransactionClient;

export function findUserById(userId: string, db: UserClient = prisma) {
  return db.user.findUnique({
    where: {
      id: userId,
    },
  });
}

export function findUserByEmail(email: string, db: UserClient = prisma) {
  return db.user.findUnique({
    where: {
      email,
    },
  });
}
