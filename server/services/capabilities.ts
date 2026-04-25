import {
  type CapabilityStatus,
  type CapabilityType,
  type Prisma,
  type Sensitivity,
} from "@prisma/client";

import {
  createCapability,
  findCapabilityById,
  findCapabilityProfileById,
  listCapabilitiesForTenant,
  listCapabilitiesForTenantWithContext,
  updateCapability,
} from "@/server/repositories/capabilities";
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

export type CapabilityMutationInput = {
  capabilityType?: CapabilityType;
  companyId?: string | null;
  confidence?: number | null;
  description?: string | null;
  noteId?: string | null;
  personId?: string | null;
  sensitivity?: Sensitivity;
  status?: CapabilityStatus;
  title: string;
};

function capabilityAuditMetadata(
  capability: {
    capabilityType: CapabilityType;
    companyId: string | null;
    confidence: number | null;
    description: string | null;
    id: string;
    noteId: string | null;
    personId: string | null;
    sensitivity: Sensitivity;
    status: CapabilityStatus;
  },
  extra?: Record<string, unknown>,
) {
  return {
    capabilityId: capability.id,
    capabilityType: capability.capabilityType,
    companyId: capability.companyId,
    confidencePresent: capability.confidence !== null,
    hasDescription: Boolean(capability.description),
    noteId: capability.noteId,
    personId: capability.personId,
    sensitivity: capability.sensitivity,
    status: capability.status,
    ...extra,
  };
}

async function validateCapabilityLinks(
  context: TenantContext,
  data: {
    companyId?: string | null;
    noteId?: string | null;
    personId?: string | null;
  },
  db: Prisma.TransactionClient,
) {
  await Promise.all([
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "PERSON",
        entityId: data.personId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "COMPANY",
        entityId: data.companyId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "NOTE",
        entityId: data.noteId,
      },
      db,
    ),
  ]);
}

export async function createTenantCapability(
  context: TenantContext,
  data: CapabilityMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    await validateCapabilityLinks(context, data, tx);

    const capability = await createCapability(
      {
        tenantId: context.tenantId,
        data: {
          ...data,
          createdByUserId: context.userId,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "capability.created",
        entityType: "Capability",
        entityId: capability.id,
        metadata: capabilityAuditMetadata(capability, {
          source: "manual-form",
        }),
      },
      tx,
    );

    return capability;
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

export async function getTenantCapabilityProfile(
  context: TenantContext,
  capabilityId: string,
) {
  await requireTenantAccess(context);

  return findCapabilityProfileById({
    tenantId: context.tenantId,
    capabilityId,
  });
}

export async function listTenantCapabilities(context: TenantContext) {
  await requireTenantAccess(context);

  return listCapabilitiesForTenant(context.tenantId);
}

export async function listTenantCapabilitiesWithContext(
  context: TenantContext,
) {
  await requireTenantAccess(context);

  return listCapabilitiesForTenantWithContext(context.tenantId);
}

export async function updateTenantCapability(
  context: TenantContext,
  capabilityId: string,
  data: CapabilityMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findCapabilityById(
      {
        tenantId: context.tenantId,
        capabilityId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("CAPABILITY", capabilityId);
    }

    await validateCapabilityLinks(context, data, tx);

    const changedFields = Object.keys(data).filter(
      (field) => data[field as keyof typeof data] !== undefined,
    );
    const capability = await updateCapability(
      {
        tenantId: context.tenantId,
        capabilityId,
        data: {
          ...data,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "capability.updated",
        entityType: "Capability",
        entityId: capability.id,
        metadata: capabilityAuditMetadata(capability, {
          changedFields,
        }),
      },
      tx,
    );

    return capability;
  });
}

export async function archiveTenantCapability(
  context: TenantContext,
  capabilityId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findCapabilityById(
      {
        tenantId: context.tenantId,
        capabilityId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("CAPABILITY", capabilityId);
    }

    const capability = await updateCapability(
      {
        tenantId: context.tenantId,
        capabilityId,
        data: {
          archivedAt: new Date(),
          status: "ARCHIVED",
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "capability.archived",
        entityType: "Capability",
        entityId: capability.id,
        metadata: capabilityAuditMetadata(capability),
      },
      tx,
    );

    return capability;
  });
}
