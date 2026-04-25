import { type Prisma } from "@prisma/client";

import {
  createVoiceMention,
  findVoiceMentionById,
  listVoiceMentionsForVoiceNote,
} from "@/server/repositories/voice-mentions";
import {
  createVoiceNote,
  findVoiceNoteById,
  listVoiceNotesForTenant,
} from "@/server/repositories/voice-notes";
import {
  assertOptionalPolymorphicRelationshipBelongsToTenant,
  assertOptionalRelationshipEntityBelongsToTenant,
  assertRelationshipEntityBelongsToTenant,
} from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function createTenantVoiceNote(
  context: TenantContext,
  data: Omit<
    Prisma.VoiceNoteUncheckedCreateInput,
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

  return createVoiceNote({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
  });
}

export async function getTenantVoiceNote(
  context: TenantContext,
  voiceNoteId: string,
) {
  await requireTenantAccess(context);

  return findVoiceNoteById({
    tenantId: context.tenantId,
    voiceNoteId,
  });
}

export async function listTenantVoiceNotes(context: TenantContext) {
  await requireTenantAccess(context);

  return listVoiceNotesForTenant(context.tenantId);
}

export async function createTenantVoiceMention(
  context: TenantContext,
  data: Omit<
    Prisma.VoiceMentionUncheckedCreateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId"
  >,
) {
  await requireTenantAccess(context);

  await Promise.all([
    assertRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "VOICE_NOTE",
      entityId: data.voiceNoteId,
    }),
    assertOptionalPolymorphicRelationshipBelongsToTenant({
      tenantId: context.tenantId,
      entityType: data.resolvedEntityType,
      entityId: data.resolvedEntityId,
      label: "VoiceMention resolved entity",
    }),
  ]);

  return createVoiceMention({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
  });
}

export async function getTenantVoiceMention(
  context: TenantContext,
  voiceMentionId: string,
) {
  await requireTenantAccess(context);

  return findVoiceMentionById({
    tenantId: context.tenantId,
    voiceMentionId,
  });
}

export async function listTenantVoiceMentions(
  context: TenantContext,
  voiceNoteId: string,
) {
  await requireTenantAccess(context);
  await assertRelationshipEntityBelongsToTenant({
    tenantId: context.tenantId,
    entityType: "VOICE_NOTE",
    entityId: voiceNoteId,
  });

  return listVoiceMentionsForVoiceNote({
    tenantId: context.tenantId,
    voiceNoteId,
  });
}
