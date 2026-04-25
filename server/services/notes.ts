import { type Prisma } from "@prisma/client";

import { createNote, findNoteById } from "@/server/repositories/notes";
import { assertRelationshipEntityBelongsToTenant } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function createTenantNote(
  context: TenantContext,
  data: Omit<
    Prisma.NoteUncheckedCreateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId"
  >,
) {
  await requireTenantAccess(context);

  if (data.personId) {
    await assertRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "PERSON",
      entityId: data.personId,
    });
  }

  if (data.companyId) {
    await assertRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "COMPANY",
      entityId: data.companyId,
    });
  }

  if (data.meetingId) {
    await assertRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "MEETING",
      entityId: data.meetingId,
    });
  }

  return createNote({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
  });
}

export async function getTenantNote(context: TenantContext, noteId: string) {
  await requireTenantAccess(context);

  return findNoteById({
    tenantId: context.tenantId,
    noteId,
  });
}
