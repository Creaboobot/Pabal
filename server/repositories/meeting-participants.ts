import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type MeetingParticipantsClient = PrismaClient | Prisma.TransactionClient;

export function createMeetingParticipant(
  input: {
    tenantId: string;
    data: Omit<Prisma.MeetingParticipantUncheckedCreateInput, "tenantId">;
  },
  db: MeetingParticipantsClient = prisma,
) {
  return db.meetingParticipant.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingParticipants(
  input: {
    tenantId: string;
    meetingId: string;
  },
  db: MeetingParticipantsClient = prisma,
) {
  return db.meetingParticipant.findMany({
    where: {
      tenantId: input.tenantId,
      meetingId: input.meetingId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
