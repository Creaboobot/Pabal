import { type Prisma } from "@prisma/client";

import { createSourceReference } from "@/server/repositories/source-references";
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
