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
