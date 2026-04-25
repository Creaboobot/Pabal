import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type MeetingsClient = PrismaClient | Prisma.TransactionClient;

export function createMeeting(
  input: {
    tenantId: string;
    data: Omit<Prisma.MeetingUncheckedCreateInput, "tenantId">;
  },
  db: MeetingsClient = prisma,
) {
  return db.meeting.create({
    data: {
      ...input.data,
      tenantId: input.tenantId,
    },
  });
}

export function findMeetingById(
  input: {
    tenantId: string;
    meetingId: string;
  },
  db: MeetingsClient = prisma,
) {
  return db.meeting.findFirst({
    where: {
      id: input.meetingId,
      tenantId: input.tenantId,
      archivedAt: null,
    },
  });
}

export function listMeetingsForTenant(
  tenantId: string,
  db: MeetingsClient = prisma,
) {
  return db.meeting.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    orderBy: {
      occurredAt: "desc",
    },
  });
}
