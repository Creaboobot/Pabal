import {
  type IntroductionSuggestionStatus,
  type Prisma,
} from "@prisma/client";

import {
  createIntroductionSuggestion,
  findIntroductionSuggestionById,
  findIntroductionSuggestionProfileById,
  listIntroductionSuggestionsForTenant,
  listIntroductionSuggestionsForTenantWithContext,
  updateIntroductionSuggestion,
} from "@/server/repositories/introduction-suggestions";
import { createSourceReference } from "@/server/repositories/source-references";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  assertOptionalRelationshipEntityBelongsToTenant,
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export class InvalidIntroductionSuggestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidIntroductionSuggestionError";
  }
}

export type IntroductionSuggestionMutationInput = {
  capabilityId?: string | null;
  confidence?: number | null;
  fromCompanyId?: string | null;
  fromPersonId?: string | null;
  needId?: string | null;
  rationale: string;
  sourceMeetingId?: string | null;
  sourceNoteId?: string | null;
  status?: IntroductionSuggestionStatus;
  toCompanyId?: string | null;
  toPersonId?: string | null;
};

function introductionSuggestionAuditMetadata(
  suggestion: {
    capabilityId: string | null;
    confidence: number | null;
    fromCompanyId: string | null;
    fromPersonId: string | null;
    id: string;
    needId: string | null;
    status: IntroductionSuggestionStatus;
    toCompanyId: string | null;
    toPersonId: string | null;
  },
  extra?: Record<string, unknown>,
) {
  return {
    capabilityId: suggestion.capabilityId,
    confidencePresent: suggestion.confidence !== null,
    fromCompanyId: suggestion.fromCompanyId,
    fromPersonId: suggestion.fromPersonId,
    hasRationale: true,
    introductionSuggestionId: suggestion.id,
    needId: suggestion.needId,
    status: suggestion.status,
    toCompanyId: suggestion.toCompanyId,
    toPersonId: suggestion.toPersonId,
    ...extra,
  };
}

function suggestionData(data: IntroductionSuggestionMutationInput) {
  return {
    capabilityId: data.capabilityId ?? null,
    confidence: data.confidence ?? null,
    fromCompanyId: data.fromCompanyId ?? null,
    fromPersonId: data.fromPersonId ?? null,
    needId: data.needId ?? null,
    rationale: data.rationale,
    status: data.status ?? "PROPOSED",
    toCompanyId: data.toCompanyId ?? null,
    toPersonId: data.toPersonId ?? null,
  };
}

function assertMeaningfulSuggestion(data: IntroductionSuggestionMutationInput) {
  if (data.fromPersonId && data.fromPersonId === data.toPersonId) {
    throw new InvalidIntroductionSuggestionError(
      "An introduction cannot use the same person on both sides.",
    );
  }

  const contextAnchors = [
    data.needId,
    data.capabilityId,
    data.fromPersonId,
    data.fromCompanyId,
    data.toPersonId,
    data.toCompanyId,
  ].filter(Boolean);

  if (contextAnchors.length < 2) {
    throw new InvalidIntroductionSuggestionError(
      "Add at least two linked records so the introduction has enough context.",
    );
  }
}

async function validateIntroductionLinks(
  context: TenantContext,
  data: IntroductionSuggestionMutationInput,
  db: Prisma.TransactionClient,
) {
  assertMeaningfulSuggestion(data);

  await Promise.all([
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "NEED",
        entityId: data.needId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "CAPABILITY",
        entityId: data.capabilityId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "PERSON",
        entityId: data.fromPersonId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "PERSON",
        entityId: data.toPersonId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "COMPANY",
        entityId: data.fromCompanyId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "COMPANY",
        entityId: data.toCompanyId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "MEETING",
        entityId: data.sourceMeetingId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "NOTE",
        entityId: data.sourceNoteId,
      },
      db,
    ),
  ]);
}

async function createProvenanceReferences(
  context: TenantContext,
  data: {
    introductionSuggestionId: string;
    sourceMeetingId?: string | null | undefined;
    sourceNoteId?: string | null | undefined;
  },
  db: Prisma.TransactionClient,
) {
  const sources = [
    data.sourceMeetingId
      ? {
          sourceEntityId: data.sourceMeetingId,
          sourceEntityType: "MEETING" as const,
          label: "Manual introduction provenance from meeting",
        }
      : null,
    data.sourceNoteId
      ? {
          sourceEntityId: data.sourceNoteId,
          sourceEntityType: "NOTE" as const,
          label: "Manual introduction provenance from note",
        }
      : null,
  ].filter((source): source is NonNullable<typeof source> => Boolean(source));

  for (const source of sources) {
    const existing = await db.sourceReference.count({
      where: {
        tenantId: context.tenantId,
        sourceEntityId: source.sourceEntityId,
        sourceEntityType: source.sourceEntityType,
        targetEntityId: data.introductionSuggestionId,
        targetEntityType: "INTRODUCTION_SUGGESTION",
      },
    });

    if (existing > 0) {
      continue;
    }

    await createSourceReference(
      {
        tenantId: context.tenantId,
        data: {
          createdByUserId: context.userId,
          label: source.label,
          sourceEntityId: source.sourceEntityId,
          sourceEntityType: source.sourceEntityType,
          targetEntityId: data.introductionSuggestionId,
          targetEntityType: "INTRODUCTION_SUGGESTION",
        },
      },
      db,
    );
  }
}

export async function createTenantIntroductionSuggestion(
  context: TenantContext,
  data: IntroductionSuggestionMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    await validateIntroductionLinks(context, data, tx);
    const mutationData = suggestionData(data);

    const suggestion = await createIntroductionSuggestion(
      {
        tenantId: context.tenantId,
        data: {
          ...mutationData,
          createdByUserId: context.userId,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await createProvenanceReferences(
      context,
      {
        introductionSuggestionId: suggestion.id,
        sourceMeetingId: data.sourceMeetingId,
        sourceNoteId: data.sourceNoteId,
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "introduction_suggestion.created",
        entityType: "IntroductionSuggestion",
        entityId: suggestion.id,
        metadata: introductionSuggestionAuditMetadata(suggestion, {
          source: "manual-form",
          sourceMeetingId: data.sourceMeetingId,
          sourceNoteId: data.sourceNoteId,
        }),
      },
      tx,
    );

    return suggestion;
  });
}

export async function getTenantIntroductionSuggestion(
  context: TenantContext,
  introductionSuggestionId: string,
) {
  await requireTenantAccess(context);

  return findIntroductionSuggestionById({
    tenantId: context.tenantId,
    introductionSuggestionId,
  });
}

export async function getTenantIntroductionSuggestionProfile(
  context: TenantContext,
  introductionSuggestionId: string,
) {
  await requireTenantAccess(context);

  return findIntroductionSuggestionProfileById({
    tenantId: context.tenantId,
    introductionSuggestionId,
  });
}

export async function listTenantIntroductionSuggestions(
  context: TenantContext,
) {
  await requireTenantAccess(context);

  return listIntroductionSuggestionsForTenant(context.tenantId);
}

export async function listTenantIntroductionSuggestionsWithContext(
  context: TenantContext,
) {
  await requireTenantAccess(context);

  return listIntroductionSuggestionsForTenantWithContext(context.tenantId);
}

export async function updateTenantIntroductionSuggestion(
  context: TenantContext,
  introductionSuggestionId: string,
  data: IntroductionSuggestionMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findIntroductionSuggestionById(
      {
        tenantId: context.tenantId,
        introductionSuggestionId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError(
        "INTRODUCTION_SUGGESTION",
        introductionSuggestionId,
      );
    }

    await validateIntroductionLinks(context, data, tx);
    const mutationData = suggestionData(data);

    const changedFields = Object.keys(mutationData).filter(
      (field) =>
        mutationData[field as keyof typeof mutationData] !== undefined,
    );
    const suggestion = await updateIntroductionSuggestion(
      {
        tenantId: context.tenantId,
        introductionSuggestionId,
        data: {
          ...mutationData,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await createProvenanceReferences(
      context,
      {
        introductionSuggestionId: suggestion.id,
        sourceMeetingId: data.sourceMeetingId,
        sourceNoteId: data.sourceNoteId,
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "introduction_suggestion.updated",
        entityType: "IntroductionSuggestion",
        entityId: suggestion.id,
        metadata: introductionSuggestionAuditMetadata(suggestion, {
          changedFields,
          sourceMeetingId: data.sourceMeetingId,
          sourceNoteId: data.sourceNoteId,
        }),
      },
      tx,
    );

    return suggestion;
  });
}

export async function archiveTenantIntroductionSuggestion(
  context: TenantContext,
  introductionSuggestionId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findIntroductionSuggestionById(
      {
        tenantId: context.tenantId,
        introductionSuggestionId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError(
        "INTRODUCTION_SUGGESTION",
        introductionSuggestionId,
      );
    }

    const suggestion = await updateIntroductionSuggestion(
      {
        tenantId: context.tenantId,
        introductionSuggestionId,
        data: {
          archivedAt: new Date(),
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "introduction_suggestion.archived",
        entityType: "IntroductionSuggestion",
        entityId: suggestion.id,
        metadata: introductionSuggestionAuditMetadata(suggestion),
      },
      tx,
    );

    return suggestion;
  });
}

export async function dismissTenantIntroductionSuggestion(
  context: TenantContext,
  introductionSuggestionId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findIntroductionSuggestionById(
      {
        tenantId: context.tenantId,
        introductionSuggestionId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError(
        "INTRODUCTION_SUGGESTION",
        introductionSuggestionId,
      );
    }

    const suggestion = await updateIntroductionSuggestion(
      {
        tenantId: context.tenantId,
        introductionSuggestionId,
        data: {
          status: "REJECTED",
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "introduction_suggestion.dismissed",
        entityType: "IntroductionSuggestion",
        entityId: suggestion.id,
        metadata: introductionSuggestionAuditMetadata(suggestion, {
          statusTransition: `${existing.status}->REJECTED`,
        }),
      },
      tx,
    );

    return suggestion;
  });
}
