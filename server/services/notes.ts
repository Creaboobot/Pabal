import { type Prisma, type NoteType, type RecordSourceType, type Sensitivity } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  createNote,
  findNoteById,
  findNoteProfileById,
  listNotesForTenant,
  updateNote,
} from "@/server/repositories/notes";
import {
  listSourceReferencesForSource,
  listSourceReferencesForTarget,
} from "@/server/repositories/source-references";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  assertOptionalRelationshipEntityBelongsToTenant,
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

type NoteMutationInput = {
  body: string;
  companyId?: string | null;
  meetingId?: string | null;
  noteType?: NoteType;
  personId?: string | null;
  sensitivity?: Sensitivity;
  sourceType?: RecordSourceType;
  summary?: string | null;
};

async function validateNoteLinks(
  context: TenantContext,
  data: {
    companyId?: string | null;
    meetingId?: string | null;
    personId?: string | null;
  },
  db: Prisma.TransactionClient,
) {
  await assertOptionalRelationshipEntityBelongsToTenant(
    {
      tenantId: context.tenantId,
      entityType: "PERSON",
      entityId: data.personId,
    },
    db,
  );
  await assertOptionalRelationshipEntityBelongsToTenant(
    {
      tenantId: context.tenantId,
      entityType: "COMPANY",
      entityId: data.companyId,
    },
    db,
  );
  await assertOptionalRelationshipEntityBelongsToTenant(
    {
      tenantId: context.tenantId,
      entityType: "MEETING",
      entityId: data.meetingId,
    },
    db,
  );
}

function noteAuditMetadata(
  note: {
    body: string;
    companyId: string | null;
    meetingId: string | null;
    noteType: NoteType;
    personId: string | null;
    sensitivity: Sensitivity;
    sourceType: RecordSourceType;
    summary: string | null;
  },
  source: string,
) {
  return {
    bodyLength: note.body.length,
    companyId: note.companyId,
    hasSummary: Boolean(note.summary),
    meetingId: note.meetingId,
    noteType: note.noteType,
    personId: note.personId,
    sensitivity: note.sensitivity,
    source,
    sourceType: note.sourceType,
  };
}

export async function createTenantNote(
  context: TenantContext,
  data: NoteMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    await validateNoteLinks(context, data, tx);

    const note = await createNote(
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
        action: "note.created",
        entityType: "Note",
        entityId: note.id,
        metadata: noteAuditMetadata(note, "manual-form"),
      },
      tx,
    );

    return note;
  });
}

export async function getTenantNote(context: TenantContext, noteId: string) {
  await requireTenantAccess(context);

  return findNoteById({
    tenantId: context.tenantId,
    noteId,
  });
}

export async function getTenantNoteProfile(
  context: TenantContext,
  noteId: string,
) {
  await requireTenantAccess(context);

  const note = await findNoteProfileById({
    tenantId: context.tenantId,
    noteId,
  });

  if (!note) {
    return null;
  }

  const [sourceReferences, targetReferences] = await Promise.all([
    listSourceReferencesForSource({
      tenantId: context.tenantId,
      sourceEntityType: "NOTE",
      sourceEntityId: note.id,
    }),
    listSourceReferencesForTarget({
      tenantId: context.tenantId,
      targetEntityType: "NOTE",
      targetEntityId: note.id,
    }),
  ]);

  return {
    ...note,
    sourceReferences,
    targetReferences,
  };
}

export async function listTenantNotes(context: TenantContext) {
  await requireTenantAccess(context);

  return listNotesForTenant(context.tenantId);
}

export async function updateTenantNote(
  context: TenantContext,
  noteId: string,
  data: NoteMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findNoteById(
      {
        tenantId: context.tenantId,
        noteId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("NOTE", noteId);
    }

    await validateNoteLinks(context, data, tx);

    const changedFields = Object.keys(data).filter(
      (field) => data[field as keyof typeof data] !== undefined,
    );
    const note = await updateNote(
      {
        tenantId: context.tenantId,
        noteId,
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
        action: "note.updated",
        entityType: "Note",
        entityId: note.id,
        metadata: {
          bodyLength: note.body.length,
          changedFields,
          companyId: note.companyId,
          hasSummary: Boolean(note.summary),
          meetingId: note.meetingId,
          noteType: note.noteType,
          personId: note.personId,
          sensitivity: note.sensitivity,
          sourceType: note.sourceType,
        },
      },
      tx,
    );

    return note;
  });
}

export async function archiveTenantNote(
  context: TenantContext,
  noteId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findNoteById(
      {
        tenantId: context.tenantId,
        noteId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("NOTE", noteId);
    }

    const note = await updateNote(
      {
        tenantId: context.tenantId,
        noteId,
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
        action: "note.archived",
        entityType: "Note",
        entityId: note.id,
        metadata: {
          companyId: note.companyId,
          meetingId: note.meetingId,
          noteType: note.noteType,
          personId: note.personId,
          source: "manual-form",
          sourceType: note.sourceType,
        },
      },
      tx,
    );

    return note;
  });
}
