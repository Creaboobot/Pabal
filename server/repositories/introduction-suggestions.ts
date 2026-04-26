import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type IntroductionSuggestionsClient = PrismaClient | Prisma.TransactionClient;

const introductionSuggestionContextInclude = {
  capability: {
    select: {
      capabilityType: true,
      id: true,
      status: true,
      title: true,
    },
  },
  fromCompany: {
    select: {
      id: true,
      name: true,
    },
  },
  fromPerson: {
    select: {
      displayName: true,
      id: true,
    },
  },
  need: {
    select: {
      id: true,
      needType: true,
      priority: true,
      status: true,
      title: true,
    },
  },
  toCompany: {
    select: {
      id: true,
      name: true,
    },
  },
  toPerson: {
    select: {
      displayName: true,
      id: true,
    },
  },
} satisfies Prisma.IntroductionSuggestionInclude;

export type IntroductionSuggestionWithContext =
  Prisma.IntroductionSuggestionGetPayload<{
    include: typeof introductionSuggestionContextInclude;
  }>;

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

export function updateIntroductionSuggestion(
  input: {
    tenantId: string;
    introductionSuggestionId: string;
    data: Prisma.IntroductionSuggestionUncheckedUpdateInput;
  },
  db: IntroductionSuggestionsClient = prisma,
) {
  return db.introductionSuggestion.update({
    where: {
      id_tenantId: {
        id: input.introductionSuggestionId,
        tenantId: input.tenantId,
      },
    },
    data: input.data,
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

export function findIntroductionSuggestionProfileById(
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
    include: introductionSuggestionContextInclude,
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

export function listIntroductionSuggestionsForTenantWithContext(
  tenantId: string,
  db: IntroductionSuggestionsClient = prisma,
) {
  return db.introductionSuggestion.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    include: introductionSuggestionContextInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}
