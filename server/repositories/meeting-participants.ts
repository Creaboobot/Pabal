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

export function findMeetingParticipantById(
  input: {
    tenantId: string;
    meetingParticipantId: string;
  },
  db: MeetingParticipantsClient = prisma,
) {
  return db.meetingParticipant.findFirst({
    where: {
      id: input.meetingParticipantId,
      tenantId: input.tenantId,
    },
    include: {
      company: true,
      meeting: true,
      person: true,
    },
  });
}

export function findKnownPersonMeetingParticipant(
  input: {
    tenantId: string;
    meetingId: string;
    personId: string;
  },
  db: MeetingParticipantsClient = prisma,
) {
  return db.meetingParticipant.findFirst({
    where: {
      meetingId: input.meetingId,
      personId: input.personId,
      tenantId: input.tenantId,
    },
  });
}

export function deleteMeetingParticipant(
  input: {
    tenantId: string;
    meetingParticipantId: string;
  },
  db: MeetingParticipantsClient = prisma,
) {
  return db.meetingParticipant.delete({
    where: {
      id_tenantId: {
        id: input.meetingParticipantId,
        tenantId: input.tenantId,
      },
    },
  });
}
