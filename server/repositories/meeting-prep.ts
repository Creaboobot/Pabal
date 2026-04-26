import {
  type AIProposalStatus,
  type CapabilityStatus,
  type CommitmentStatus,
  type IntroductionSuggestionStatus,
  type NeedStatus,
  type Prisma,
  type PrismaClient,
  type TaskStatus,
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type MeetingPrepClient = PrismaClient | Prisma.TransactionClient;

const OPEN_TASK_STATUSES: TaskStatus[] = ["OPEN", "SNOOZED"];
const OPEN_COMMITMENT_STATUSES: CommitmentStatus[] = [
  "OPEN",
  "WAITING",
  "OVERDUE",
];
const ACTIVE_NEED_STATUSES: NeedStatus[] = ["OPEN", "IN_PROGRESS", "PARKED"];
const ACTIVE_CAPABILITY_STATUSES: CapabilityStatus[] = ["ACTIVE", "PARKED"];
const ACTIVE_INTRODUCTION_STATUSES: IntroductionSuggestionStatus[] = [
  "PROPOSED",
  "ACCEPTED",
  "OPT_IN_REQUESTED",
  "INTRO_SENT",
];
const PENDING_PROPOSAL_STATUSES: AIProposalStatus[] = [
  "PENDING_REVIEW",
  "IN_REVIEW",
];

const noteSelect = {
  body: true,
  companyId: true,
  createdAt: true,
  id: true,
  meetingId: true,
  noteType: true,
  personId: true,
  sensitivity: true,
  sourceType: true,
  summary: true,
  updatedAt: true,
} satisfies Prisma.NoteSelect;

const meetingListSelect = {
  createdAt: true,
  id: true,
  location: true,
  occurredAt: true,
  primaryCompany: {
    select: {
      id: true,
      name: true,
    },
  },
  summary: true,
  title: true,
  participants: {
    select: {
      companyId: true,
      personId: true,
    },
  },
} satisfies Prisma.MeetingSelect;

const taskSelect = {
  companyId: true,
  dueAt: true,
  id: true,
  meetingId: true,
  noteId: true,
  personId: true,
  priority: true,
  status: true,
  taskType: true,
  title: true,
} satisfies Prisma.TaskSelect;

const commitmentSelect = {
  counterpartyCompanyId: true,
  counterpartyPersonId: true,
  dueAt: true,
  dueWindowEnd: true,
  dueWindowStart: true,
  id: true,
  meetingId: true,
  noteId: true,
  ownerCompanyId: true,
  ownerPersonId: true,
  ownerType: true,
  sensitivity: true,
  status: true,
  title: true,
} satisfies Prisma.CommitmentSelect;

const needSelect = {
  companyId: true,
  confidence: true,
  id: true,
  meetingId: true,
  needType: true,
  noteId: true,
  personId: true,
  priority: true,
  sensitivity: true,
  status: true,
  title: true,
} satisfies Prisma.NeedSelect;

const capabilitySelect = {
  capabilityType: true,
  companyId: true,
  confidence: true,
  id: true,
  noteId: true,
  personId: true,
  sensitivity: true,
  status: true,
  title: true,
} satisfies Prisma.CapabilitySelect;

const introductionSelect = {
  capabilityId: true,
  confidence: true,
  fromCompanyId: true,
  fromPersonId: true,
  id: true,
  needId: true,
  rationale: true,
  status: true,
  toCompanyId: true,
  toPersonId: true,
} satisfies Prisma.IntroductionSuggestionSelect;

const proposalSelect = {
  confidence: true,
  id: true,
  proposalType: true,
  sourceMeetingId: true,
  sourceNoteId: true,
  status: true,
  targetEntityId: true,
  targetEntityType: true,
  title: true,
} satisfies Prisma.AIProposalSelect;

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export type MeetingPrepBase = NonNullable<
  Awaited<ReturnType<typeof findMeetingPrepBase>>
>;
export type MeetingPrepNote = Awaited<
  ReturnType<typeof listMeetingPrepNotes>
>[number];
export type MeetingPrepRecentMeeting = Awaited<
  ReturnType<typeof listMeetingPrepRecentMeetings>
>[number];
export type MeetingPrepTask = Awaited<
  ReturnType<typeof listMeetingPrepTasks>
>[number];
export type MeetingPrepCommitment = Awaited<
  ReturnType<typeof listMeetingPrepCommitments>
>[number];
export type MeetingPrepNeed = Awaited<
  ReturnType<typeof listMeetingPrepNeeds>
>[number];
export type MeetingPrepCapability = Awaited<
  ReturnType<typeof listMeetingPrepCapabilities>
>[number];
export type MeetingPrepIntroduction = Awaited<
  ReturnType<typeof listMeetingPrepIntroductions>
>[number];
export type MeetingPrepProposal = Awaited<
  ReturnType<typeof listMeetingPrepProposals>
>[number];
export type MeetingPrepSourceReference = Awaited<
  ReturnType<typeof listMeetingPrepSourceReferences>
>[number];

export function findMeetingPrepBase(
  input: {
    meetingId: string;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  return db.meeting.findFirst({
    select: {
      createdAt: true,
      endedAt: true,
      id: true,
      location: true,
      occurredAt: true,
      primaryCompany: {
        select: {
          id: true,
          name: true,
        },
      },
      primaryCompanyId: true,
      sourceType: true,
      summary: true,
      title: true,
      updatedAt: true,
      participants: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          companyId: true,
          emailSnapshot: true,
          id: true,
          nameSnapshot: true,
          participantRole: true,
          person: {
            select: {
              displayName: true,
              email: true,
              id: true,
              jobTitle: true,
            },
          },
          personId: true,
        },
      },
    },
    where: {
      archivedAt: null,
      id: input.meetingId,
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingPrepNotes(
  input: {
    meetingId: string;
    take: number;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  return db.note.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: noteSelect,
    take: input.take,
    where: {
      archivedAt: null,
      meetingId: input.meetingId,
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingPrepPersonNotes(
  input: {
    personIds: string[];
    take: number;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  if (input.personIds.length === 0) {
    return Promise.resolve([]);
  }

  return db.note.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: noteSelect,
    take: input.take,
    where: {
      archivedAt: null,
      personId: { in: input.personIds },
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingPrepCompanyNotes(
  input: {
    companyIds: string[];
    take: number;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  if (input.companyIds.length === 0) {
    return Promise.resolve([]);
  }

  return db.note.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: noteSelect,
    take: input.take,
    where: {
      archivedAt: null,
      companyId: { in: input.companyIds },
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingPrepRecentMeetings(
  input: {
    companyIds: string[];
    meetingId: string;
    personIds: string[];
    take: number;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  const or: Prisma.MeetingWhereInput[] = [];

  if (input.personIds.length > 0) {
    or.push({
      participants: {
        some: {
          personId: { in: input.personIds },
          tenantId: input.tenantId,
        },
      },
    });
  }

  if (input.companyIds.length > 0) {
    or.push(
      { primaryCompanyId: { in: input.companyIds } },
      {
        participants: {
          some: {
            companyId: { in: input.companyIds },
            tenantId: input.tenantId,
          },
        },
      },
    );
  }

  if (or.length === 0) {
    return Promise.resolve([]);
  }

  return db.meeting.findMany({
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    select: meetingListSelect,
    take: input.take,
    where: {
      archivedAt: null,
      id: { not: input.meetingId },
      OR: or,
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingPrepTasks(
  input: {
    companyIds: string[];
    meetingId: string;
    noteIds: string[];
    personIds: string[];
    take: number;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  const or: Prisma.TaskWhereInput[] = [{ meetingId: input.meetingId }];

  if (input.personIds.length > 0) {
    or.push({ personId: { in: input.personIds } });
  }

  if (input.companyIds.length > 0) {
    or.push({ companyId: { in: input.companyIds } });
  }

  if (input.noteIds.length > 0) {
    or.push({ noteId: { in: input.noteIds } });
  }

  return db.task.findMany({
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    select: taskSelect,
    take: input.take,
    where: {
      archivedAt: null,
      OR: or,
      status: { in: OPEN_TASK_STATUSES },
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingPrepCommitments(
  input: {
    companyIds: string[];
    meetingId: string;
    noteIds: string[];
    personIds: string[];
    take: number;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  const or: Prisma.CommitmentWhereInput[] = [{ meetingId: input.meetingId }];

  if (input.personIds.length > 0) {
    or.push(
      { ownerPersonId: { in: input.personIds } },
      { counterpartyPersonId: { in: input.personIds } },
    );
  }

  if (input.companyIds.length > 0) {
    or.push(
      { ownerCompanyId: { in: input.companyIds } },
      { counterpartyCompanyId: { in: input.companyIds } },
    );
  }

  if (input.noteIds.length > 0) {
    or.push({ noteId: { in: input.noteIds } });
  }

  return db.commitment.findMany({
    orderBy: [
      { dueAt: "asc" },
      { dueWindowEnd: "asc" },
      { createdAt: "desc" },
    ],
    select: commitmentSelect,
    take: input.take,
    where: {
      archivedAt: null,
      OR: or,
      status: { in: OPEN_COMMITMENT_STATUSES },
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingPrepNeeds(
  input: {
    companyIds: string[];
    meetingId: string;
    noteIds: string[];
    personIds: string[];
    take: number;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  const or: Prisma.NeedWhereInput[] = [{ meetingId: input.meetingId }];

  if (input.personIds.length > 0) {
    or.push({ personId: { in: input.personIds } });
  }

  if (input.companyIds.length > 0) {
    or.push({ companyId: { in: input.companyIds } });
  }

  if (input.noteIds.length > 0) {
    or.push({ noteId: { in: input.noteIds } });
  }

  return db.need.findMany({
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    select: needSelect,
    take: input.take,
    where: {
      archivedAt: null,
      OR: or,
      status: { in: ACTIVE_NEED_STATUSES },
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingPrepCapabilities(
  input: {
    companyIds: string[];
    noteIds: string[];
    personIds: string[];
    take: number;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  const or: Prisma.CapabilityWhereInput[] = [];

  if (input.personIds.length > 0) {
    or.push({ personId: { in: input.personIds } });
  }

  if (input.companyIds.length > 0) {
    or.push({ companyId: { in: input.companyIds } });
  }

  if (input.noteIds.length > 0) {
    or.push({ noteId: { in: input.noteIds } });
  }

  if (or.length === 0) {
    return Promise.resolve([]);
  }

  return db.capability.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: capabilitySelect,
    take: input.take,
    where: {
      archivedAt: null,
      OR: or,
      status: { in: ACTIVE_CAPABILITY_STATUSES },
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingPrepIntroductions(
  input: {
    capabilityIds: string[];
    companyIds: string[];
    needIds: string[];
    personIds: string[];
    take: number;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  const or: Prisma.IntroductionSuggestionWhereInput[] = [];

  if (input.personIds.length > 0) {
    or.push(
      { fromPersonId: { in: input.personIds } },
      { toPersonId: { in: input.personIds } },
    );
  }

  if (input.companyIds.length > 0) {
    or.push(
      { fromCompanyId: { in: input.companyIds } },
      { toCompanyId: { in: input.companyIds } },
    );
  }

  if (input.needIds.length > 0) {
    or.push({ needId: { in: input.needIds } });
  }

  if (input.capabilityIds.length > 0) {
    or.push({ capabilityId: { in: input.capabilityIds } });
  }

  if (or.length === 0) {
    return Promise.resolve([]);
  }

  return db.introductionSuggestion.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: introductionSelect,
    take: input.take,
    where: {
      archivedAt: null,
      OR: or,
      status: { in: ACTIVE_INTRODUCTION_STATUSES },
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingPrepProposals(
  input: {
    companyIds: string[];
    meetingId: string;
    noteIds: string[];
    personIds: string[];
    take: number;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  const or: Prisma.AIProposalWhereInput[] = [
    { sourceMeetingId: input.meetingId },
    { targetEntityId: input.meetingId, targetEntityType: "MEETING" },
  ];

  if (input.noteIds.length > 0) {
    or.push(
      { sourceNoteId: { in: input.noteIds } },
      {
        targetEntityId: { in: input.noteIds },
        targetEntityType: "NOTE",
      },
    );
  }

  if (input.personIds.length > 0) {
    or.push({
      targetEntityId: { in: input.personIds },
      targetEntityType: "PERSON",
    });
  }

  if (input.companyIds.length > 0) {
    or.push({
      targetEntityId: { in: input.companyIds },
      targetEntityType: "COMPANY",
    });
  }

  return db.aIProposal.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: proposalSelect,
    take: input.take,
    where: {
      archivedAt: null,
      OR: or,
      status: { in: PENDING_PROPOSAL_STATUSES },
      tenantId: input.tenantId,
    },
  });
}

export function listMeetingPrepSourceReferences(
  input: {
    meetingId: string;
    take: number;
    tenantId: string;
  },
  db: MeetingPrepClient = prisma,
) {
  return db.sourceReference.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      confidence: true,
      createdAt: true,
      id: true,
      label: true,
      reason: true,
      sourceEntityId: true,
      sourceEntityType: true,
      targetEntityId: true,
      targetEntityType: true,
    },
    take: input.take,
    where: {
      OR: [
        {
          sourceEntityId: input.meetingId,
          sourceEntityType: "MEETING",
        },
        {
          targetEntityId: input.meetingId,
          targetEntityType: "MEETING",
        },
      ],
      tenantId: input.tenantId,
    },
  });
}

export { unique as uniqueMeetingPrepIds };
