import { type Prisma, type SourceEntityType } from "@prisma/client";

import {
  createSourceReference,
  listSourceReferencesForSource,
  listSourceReferencesForTarget,
} from "@/server/repositories/source-references";
import { assertRelationshipEntityBelongsToTenant } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function createTenantSourceReference(
  context: TenantContext,
  data: Omit<
    Prisma.SourceReferenceUncheckedCreateInput,
    "tenantId" | "createdByUserId"
  >,
) {
  await requireTenantAccess(context);
  await assertRelationshipEntityBelongsToTenant({
    tenantId: context.tenantId,
    entityType: data.sourceEntityType,
    entityId: data.sourceEntityId,
  });
  await assertRelationshipEntityBelongsToTenant({
    tenantId: context.tenantId,
    entityType: data.targetEntityType,
    entityId: data.targetEntityId,
  });

  return createSourceReference({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
    },
  });
}

export async function listTenantSourceReferencesForTarget(
  context: TenantContext,
  data: {
    targetEntityId: string;
    targetEntityType: SourceEntityType;
  },
) {
  await requireTenantAccess(context);
  await assertRelationshipEntityBelongsToTenant({
    tenantId: context.tenantId,
    entityType: data.targetEntityType,
    entityId: data.targetEntityId,
  });

  return listSourceReferencesForTarget({
    tenantId: context.tenantId,
    targetEntityType: data.targetEntityType,
    targetEntityId: data.targetEntityId,
  });
}

export async function listTenantSourceReferencesForSource(
  context: TenantContext,
  data: {
    sourceEntityId: string;
    sourceEntityType: SourceEntityType;
  },
) {
  await requireTenantAccess(context);
  await assertRelationshipEntityBelongsToTenant({
    tenantId: context.tenantId,
    entityType: data.sourceEntityType,
    entityId: data.sourceEntityId,
  });

  return listSourceReferencesForSource({
    tenantId: context.tenantId,
    sourceEntityType: data.sourceEntityType,
    sourceEntityId: data.sourceEntityId,
  });
}
