import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type IntroductionSuggestionsClient = PrismaClient | Prisma.TransactionClient;

export function createIntroductionSuggestion(
  input: {
    tenantId: string;
    data: Omit<Prisma.IntroductionSuggestionUncheckedCreateInput, "tenantId">;
  },
  db: IntroductionSuggestionsClient = prisma,
) {
  return db.introductionSuggestion.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findIntroductionSuggestionById(
  input: {
    tenantId: string;
    introductionSuggestionId: string;
  },
  db: IntroductionSuggestionsClient = prisma,
) {
  return db.introductionSuggestion.findFirst({
    where: {
      id: input.introductionSuggestionId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function listIntroductionSuggestionsForTenant(
  tenantId: string,
  db: IntroductionSuggestionsClient = prisma,
) {
  return db.introductionSuggestion.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
