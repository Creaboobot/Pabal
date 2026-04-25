import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type VoiceMentionsClient = PrismaClient | Prisma.TransactionClient;

export function createVoiceMention(
  input: {
    tenantId: string;
    data: Omit<Prisma.VoiceMentionUncheckedCreateInput, "tenantId">;
  },
  db: VoiceMentionsClient = prisma,
) {
  return db.voiceMention.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findVoiceMentionById(
  input: {
    tenantId: string;
    voiceMentionId: string;
  },
  db: VoiceMentionsClient = prisma,
) {
  return db.voiceMention.findFirst({
    where: {
      id: input.voiceMentionId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function listVoiceMentionsForVoiceNote(
  input: {
    tenantId: string;
    voiceNoteId: string;
  },
  db: VoiceMentionsClient = prisma,
) {
  return db.voiceMention.findMany({
    where: {
      tenantId: input.tenantId,
      voiceNoteId: input.voiceNoteId,
      archivedAt: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
