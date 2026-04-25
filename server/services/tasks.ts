import { type Prisma } from "@prisma/client";

import {
  createTask,
  findTaskById,
  listTasksForTenant,
} from "@/server/repositories/tasks";
import { assertOptionalRelationshipEntityBelongsToTenant } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function createTenantTask(
  context: TenantContext,
  data: Omit<
    Prisma.TaskUncheckedCreateInput,
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
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "COMMITMENT",
      entityId: data.commitmentId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "INTRODUCTION_SUGGESTION",
      entityId: data.introductionSuggestionId,
    }),
  ]);

  return createTask({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
  });
}

export async function getTenantTask(context: TenantContext, taskId: string) {
  await requireTenantAccess(context);

  return findTaskById({
    tenantId: context.tenantId,
    taskId,
  });
}

export async function listTenantTasks(context: TenantContext) {
  await requireTenantAccess(context);

  return listTasksForTenant(context.tenantId);
}
