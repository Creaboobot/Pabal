import { type PrismaClient, type Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type RelationshipContextClient = PrismaClient | Prisma.TransactionClient;

const meetingSelect = {
  id: true,
  location: true,
  occurredAt: true,
  summary: true,
  title: true,
} satisfies Prisma.MeetingSelect;

const noteSelect = {
  body: true,
  createdAt: true,
  id: true,
  noteType: true,
  sensitivity: true,
  sourceType: true,
  summary: true,
} satisfies Prisma.NoteSelect;

export function listLatestMeetingsForPerson(
  input: {
    tenantId: string;
    personId: string;
    take: number;
  },
  db: RelationshipContextClient = prisma,
) {
  return db.meeting.findMany({
    where: {
      tenantId: input.tenantId,
      archivedAt: null,
      participants: {
        some: {
          tenantId: input.tenantId,
          personId: input.personId,
        },
      },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    select: meetingSelect,
    take: input.take,
  });
}

export function listLatestNotesForPerson(
  input: {
    tenantId: string;
    personId: string;
    take: number;
  },
  db: RelationshipContextClient = prisma,
) {
  return db.note.findMany({
    where: {
      tenantId: input.tenantId,
      archivedAt: null,
      personId: input.personId,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: noteSelect,
    take: input.take,
  });
}

export function listLatestMeetingsForCompany(
  input: {
    tenantId: string;
    companyId: string;
    take: number;
  },
  db: RelationshipContextClient = prisma,
) {
  return db.meeting.findMany({
    where: {
      tenantId: input.tenantId,
      archivedAt: null,
      OR: [
        {
          primaryCompanyId: input.companyId,
        },
        {
          participants: {
            some: {
              tenantId: input.tenantId,
              companyId: input.companyId,
            },
          },
        },
      ],
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    select: meetingSelect,
    take: input.take,
  });
}

export function listLatestNotesForCompany(
  input: {
    tenantId: string;
    companyId: string;
    take: number;
  },
  db: RelationshipContextClient = prisma,
) {
  return db.note.findMany({
    where: {
      tenantId: input.tenantId,
      archivedAt: null,
      companyId: input.companyId,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: noteSelect,
    take: input.take,
  });
}
