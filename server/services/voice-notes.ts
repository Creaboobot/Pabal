import { type Prisma } from "@prisma/client";

import {
  createVoiceMention,
  findVoiceMentionById,
  listVoiceMentionsForVoiceNote,
} from "@/server/repositories/voice-mentions";
import {
  createVoiceNote,
  findVoiceNoteById,
  findVoiceNoteProfileById,
  listVoiceNotesForTenant,
  updateVoiceNote,
} from "@/server/repositories/voice-notes";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  assertOptionalPolymorphicRelationshipBelongsToTenant,
  assertOptionalRelationshipEntityBelongsToTenant,
  assertRelationshipEntityBelongsToTenant,
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export type VoiceNoteReviewInput = {
  companyId?: string | null;
  editedTranscriptText?: string | null;
  meetingId?: string | null;
  noteId?: string | null;
  personId?: string | null;
  title?: string | null;
};

async function validateVoiceNoteSourceLinks(
  context: TenantContext,
  data: {
    companyId?: string | null;
    meetingId?: string | null;
    noteId?: string | null;
    personId?: string | null;
  },
  db?: Prisma.TransactionClient,
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

function voiceNoteAuditMetadata(input: {
  changedFields?: string[];
  voiceNote: {
    audioRetentionStatus: string;
    companyId: string | null;
    editedTranscriptText: string | null;
    id: string;
    meetingId: string | null;
    noteId: string | null;
    personId: string | null;
    status: string;
    transcriptText: string | null;
  };
}) {
  return {
    audioRetentionStatus: input.voiceNote.audioRetentionStatus,
    changedFields: input.changedFields,
    companyId: input.voiceNote.companyId,
    editedTranscriptLength: input.voiceNote.editedTranscriptText?.length ?? 0,
    meetingId: input.voiceNote.meetingId,
    noteId: input.voiceNote.noteId,
    personId: input.voiceNote.personId,
    status: input.voiceNote.status,
    transcriptLength: input.voiceNote.transcriptText?.length ?? 0,
    voiceNoteId: input.voiceNote.id,
  };
}

export async function createTenantVoiceNote(
  context: TenantContext,
  data: Omit<
    Prisma.VoiceNoteUncheckedCreateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId"
  >,
) {
  await requireTenantAccess(context);

  await validateVoiceNoteSourceLinks(context, data);

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

export async function getTenantVoiceNoteProfile(
  context: TenantContext,
  voiceNoteId: string,
) {
  await requireTenantAccess(context);

  return findVoiceNoteProfileById({
    tenantId: context.tenantId,
    voiceNoteId,
  });
}

export async function listTenantVoiceNotes(context: TenantContext) {
  await requireTenantAccess(context);

  return listVoiceNotesForTenant(context.tenantId);
}

export async function updateTenantVoiceNoteReview(
  context: TenantContext,
  voiceNoteId: string,
  data: VoiceNoteReviewInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findVoiceNoteById(
      {
        tenantId: context.tenantId,
        voiceNoteId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("VOICE_NOTE", voiceNoteId);
    }

    await validateVoiceNoteSourceLinks(context, data, tx);

    const changedFields = Object.keys(data).filter(
      (field) => data[field as keyof typeof data] !== undefined,
    );
    const updateData: Prisma.VoiceNoteUncheckedUpdateInput = {
      status: "REVIEWED",
      updatedByUserId: context.userId,
    };

    if (data.companyId !== undefined) {
      updateData.companyId = data.companyId;
    }

    if (data.editedTranscriptText !== undefined) {
      updateData.editedTranscriptText = data.editedTranscriptText;
    }

    if (data.meetingId !== undefined) {
      updateData.meetingId = data.meetingId;
    }

    if (data.noteId !== undefined) {
      updateData.noteId = data.noteId;
    }

    if (data.personId !== undefined) {
      updateData.personId = data.personId;
    }

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    const voiceNote = await updateVoiceNote(
      {
        tenantId: context.tenantId,
        voiceNoteId,
        data: updateData,
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "voice_note.updated",
        entityType: "VoiceNote",
        entityId: voiceNote.id,
        metadata: voiceNoteAuditMetadata({
          changedFields,
          voiceNote,
        }),
      },
      tx,
    );

    return voiceNote;
  });
}

export async function archiveTenantVoiceNote(
  context: TenantContext,
  voiceNoteId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findVoiceNoteById(
      {
        tenantId: context.tenantId,
        voiceNoteId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("VOICE_NOTE", voiceNoteId);
    }

    const voiceNote = await updateVoiceNote(
      {
        tenantId: context.tenantId,
        voiceNoteId,
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
        action: "voice_note.archived",
        entityType: "VoiceNote",
        entityId: voiceNote.id,
        metadata: voiceNoteAuditMetadata({
          voiceNote,
        }),
      },
      tx,
    );

    return voiceNote;
  });
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
