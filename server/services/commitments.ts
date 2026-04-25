import { type Prisma } from "@prisma/client";

import {
  createCommitment,
  findCommitmentById,
  listCommitmentsForTenant,
} from "@/server/repositories/commitments";
import { assertOptionalRelationshipEntityBelongsToTenant } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function createTenantCommitment(
  context: TenantContext,
  data: Omit<
    Prisma.CommitmentUncheckedCreateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId"
  >,
) {
  await requireTenantAccess(context);

  await Promise.all([
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "PERSON",
      entityId: data.ownerPersonId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "COMPANY",
      entityId: data.ownerCompanyId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "PERSON",
      entityId: data.counterpartyPersonId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "COMPANY",
      entityId: data.counterpartyCompanyId,
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

  return createCommitment({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
  });
}

export async function getTenantCommitment(
  context: TenantContext,
  commitmentId: string,
) {
  await requireTenantAccess(context);

  return findCommitmentById({
    tenantId: context.tenantId,
    commitmentId,
  });
}

export async function listTenantCommitments(context: TenantContext) {
  await requireTenantAccess(context);

  return listCommitmentsForTenant(context.tenantId);
}
