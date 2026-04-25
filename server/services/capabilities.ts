import { type Prisma } from "@prisma/client";

import {
  createCapability,
  findCapabilityById,
  listCapabilitiesForTenant,
} from "@/server/repositories/capabilities";
import { assertOptionalRelationshipEntityBelongsToTenant } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function createTenantCapability(
  context: TenantContext,
  data: Omit<
    Prisma.CapabilityUncheckedCreateInput,
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
      entityType: "NOTE",
      entityId: data.noteId,
    }),
  ]);

  return createCapability({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
  });
}

export async function getTenantCapability(
  context: TenantContext,
  capabilityId: string,
) {
  await requireTenantAccess(context);

  return findCapabilityById({
    tenantId: context.tenantId,
    capabilityId,
  });
}

export async function listTenantCapabilities(context: TenantContext) {
  await requireTenantAccess(context);

  return listCapabilitiesForTenant(context.tenantId);
}
