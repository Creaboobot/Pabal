import { type Prisma } from "@prisma/client";

import {
  createNeed,
  findNeedById,
  listNeedsForTenant,
} from "@/server/repositories/needs";
import { assertOptionalRelationshipEntityBelongsToTenant } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function createTenantNeed(
  context: TenantContext,
  data: Omit<
    Prisma.NeedUncheckedCreateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId"
  >,
) {
  await requireTenantAccess(context);

  await Promise.all([
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "PERSON",
      entityId: data.personId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "COMPANY",
      entityId: data.companyId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "MEETING",
      entityId: data.meetingId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "NOTE",
      entityId: data.noteId,
    }),
  ]);

  return createNeed({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
  });
}

export async function getTenantNeed(context: TenantContext, needId: string) {
  await requireTenantAccess(context);

  return findNeedById({
    tenantId: context.tenantId,
    needId,
  });
}

export async function listTenantNeeds(context: TenantContext) {
  await requireTenantAccess(context);

  return listNeedsForTenant(context.tenantId);
}
