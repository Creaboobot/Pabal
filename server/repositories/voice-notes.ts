import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type VoiceNotesClient = PrismaClient | Prisma.TransactionClient;

export function createVoiceNote(
  input: {
    tenantId: string;
    data: Omit<Prisma.VoiceNoteUncheckedCreateInput, "tenantId">;
  },
  db: VoiceNotesClient = prisma,
) {
  return db.voiceNote.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findVoiceNoteById(
  input: {
    tenantId: string;
    voiceNoteId: string;
  },
  db: VoiceNotesClient = prisma,
) {
  return db.voiceNote.findFirst({
    where: {
      id: input.voiceNoteId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function listVoiceNotesForTenant(
  tenantId: string,
  db: VoiceNotesClient = prisma,
) {
  return db.voiceNote.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
