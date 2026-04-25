import {
  type NeedStatus,
  type NeedType,
  type Prisma,
  type Sensitivity,
  type TaskPriority,
} from "@prisma/client";

import {
  createNeed,
  findNeedById,
  findNeedProfileById,
  listNeedsForTenant,
  listNeedsForTenantWithContext,
  updateNeed,
} from "@/server/repositories/needs";
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

export type NeedMutationInput = {
  companyId?: string | null;
  confidence?: number | null;
  description?: string | null;
  meetingId?: string | null;
  needType?: NeedType;
  noteId?: string | null;
  personId?: string | null;
  priority?: TaskPriority;
  sensitivity?: Sensitivity;
  status?: NeedStatus;
  title: string;
};

function needAuditMetadata(
  need: {
    companyId: string | null;
    confidence: number | null;
    description: string | null;
    id: string;
    meetingId: string | null;
    needType: NeedType;
    noteId: string | null;
    personId: string | null;
    priority: TaskPriority;
    sensitivity: Sensitivity;
    status: NeedStatus;
  },
  extra?: Record<string, unknown>,
) {
  return {
    companyId: need.companyId,
    confidencePresent: need.confidence !== null,
    hasDescription: Boolean(need.description),
    meetingId: need.meetingId,
    needId: need.id,
    needType: need.needType,
    noteId: need.noteId,
    personId: need.personId,
    priority: need.priority,
    sensitivity: need.sensitivity,
    status: need.status,
    ...extra,
  };
}

async function validateNeedLinks(
  context: TenantContext,
  data: {
    companyId?: string | null;
    meetingId?: string | null;
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
        entityType: "MEETING",
        entityId: data.meetingId,
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

export async function createTenantNeed(
  context: TenantContext,
  data: NeedMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    await validateNeedLinks(context, data, tx);

    const need = await createNeed(
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
        action: "need.created",
        entityType: "Need",
        entityId: need.id,
        metadata: needAuditMetadata(need, {
          source: "manual-form",
        }),
      },
      tx,
    );

    return need;
  });
}

export async function getTenantNeed(context: TenantContext, needId: string) {
  await requireTenantAccess(context);

  return findNeedById({
    tenantId: context.tenantId,
    needId,
  });
}

export async function getTenantNeedProfile(
  context: TenantContext,
  needId: string,
) {
  await requireTenantAccess(context);

  return findNeedProfileById({
    tenantId: context.tenantId,
    needId,
  });
}

export async function listTenantNeeds(context: TenantContext) {
  await requireTenantAccess(context);

  return listNeedsForTenant(context.tenantId);
}

export async function listTenantNeedsWithContext(context: TenantContext) {
  await requireTenantAccess(context);

  return listNeedsForTenantWithContext(context.tenantId);
}

export async function updateTenantNeed(
  context: TenantContext,
  needId: string,
  data: NeedMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findNeedById(
      {
        tenantId: context.tenantId,
        needId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("NEED", needId);
    }

    await validateNeedLinks(context, data, tx);

    const changedFields = Object.keys(data).filter(
      (field) => data[field as keyof typeof data] !== undefined,
    );
    const need = await updateNeed(
      {
        tenantId: context.tenantId,
        needId,
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
        action: "need.updated",
        entityType: "Need",
        entityId: need.id,
        metadata: needAuditMetadata(need, {
          changedFields,
        }),
      },
      tx,
    );

    return need;
  });
}

export async function archiveTenantNeed(
  context: TenantContext,
  needId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findNeedById(
      {
        tenantId: context.tenantId,
        needId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("NEED", needId);
    }

    const need = await updateNeed(
      {
        tenantId: context.tenantId,
        needId,
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
        action: "need.archived",
        entityType: "Need",
        entityId: need.id,
        metadata: needAuditMetadata(need),
      },
      tx,
    );

    return need;
  });
}
