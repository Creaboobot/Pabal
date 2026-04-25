import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type NotesClient = PrismaClient | Prisma.TransactionClient;

export function createNote(
  input: {
    tenantId: string;
    data: Omit<Prisma.NoteUncheckedCreateInput, "tenantId">;
  },
  db: NotesClient = prisma,
) {
  return db.note.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findNoteById(
  input: {
    tenantId: string;
    noteId: string;
  },
  db: NotesClient = prisma,
) {
  return db.note.findFirst({
    where: {
      id: input.noteId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function findNoteProfileById(
  input: {
    tenantId: string;
    noteId: string;
  },
  db: NotesClient = prisma,
) {
  return db.note.findFirst({
    where: {
      id: input.noteId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
    include: {
      company: true,
      meeting: true,
      person: true,
    },
  });
}

export function listNotesForMeeting(
  input: {
    tenantId: string;
    meetingId: string;
    take?: number;
  },
  db: NotesClient = prisma,
) {
  const query: Prisma.NoteFindManyArgs = {
    where: {
      tenantId: input.tenantId,
      meetingId: input.meetingId,
      archivedAt: null,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      body: true,
      createdAt: true,
      id: true,
      noteType: true,
      sensitivity: true,
      sourceType: true,
      summary: true,
      updatedAt: true,
    },
  };

  if (input.take !== undefined) {
    query.take = input.take;
  }

  return db.note.findMany(query);
}

export function listNotesForTenant(tenantId: string, db: NotesClient = prisma) {
  return db.note.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function updateNote(
  input: {
    tenantId: string;
    noteId: string;
    data: Prisma.NoteUncheckedUpdateInput;
  },
  db: NotesClient = prisma,
) {
  return db.note.update({
    where: {
      id_tenantId: {
        id: input.noteId,
        tenantId: input.tenantId,
      },
    },
    data: input.data,
  });
}
