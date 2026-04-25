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

export function findMeetingProfileById(
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
    include: {
      primaryCompany: true,
      participants: {
        include: {
          company: true,
          person: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      notes: {
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
        take: 5,
        where: {
          archivedAt: null,
        },
      },
      _count: {
        select: {
          notes: true,
          participants: true,
        },
      },
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

export function listMeetingsForTenantWithSummaries(
  tenantId: string,
  db: MeetingsClient = prisma,
) {
  return db.meeting.findMany({
    where: {
      tenantId,
      archivedAt: null,
    },
    include: {
      primaryCompany: true,
      _count: {
        select: {
          notes: true,
          participants: true,
        },
      },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });
}

export function updateMeeting(
  input: {
    tenantId: string;
    meetingId: string;
    data: Prisma.MeetingUncheckedUpdateInput;
  },
  db: MeetingsClient = prisma,
) {
  return db.meeting.update({
    where: {
      id_tenantId: {
        id: input.meetingId,
        tenantId: input.tenantId,
      },
    },
    data: input.data,
  });
}
