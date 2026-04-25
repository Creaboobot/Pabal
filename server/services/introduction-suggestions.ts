import { type Prisma } from "@prisma/client";

import {
  createIntroductionSuggestion,
  findIntroductionSuggestionById,
  listIntroductionSuggestionsForTenant,
} from "@/server/repositories/introduction-suggestions";
import { assertOptionalRelationshipEntityBelongsToTenant } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function createTenantIntroductionSuggestion(
  context: TenantContext,
  data: Omit<
    Prisma.IntroductionSuggestionUncheckedCreateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId"
  >,
) {
  await requireTenantAccess(context);

  await Promise.all([
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "NEED",
      entityId: data.needId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "CAPABILITY",
      entityId: data.capabilityId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "PERSON",
      entityId: data.fromPersonId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "PERSON",
      entityId: data.toPersonId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "COMPANY",
      entityId: data.fromCompanyId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "COMPANY",
      entityId: data.toCompanyId,
    }),
  ]);

  return createIntroductionSuggestion({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
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

export async function listTenantIntroductionSuggestions(
  context: TenantContext,
) {
  await requireTenantAccess(context);

  return listIntroductionSuggestionsForTenant(context.tenantId);
}
