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

type RelationshipHealthClient = PrismaClient | Prisma.TransactionClient;

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

const relatedTaskSelect = {
  dueAt: true,
  id: true,
  priority: true,
  status: true,
  taskType: true,
  title: true,
} satisfies Prisma.TaskSelect;

const relatedCommitmentSelect = {
  dueAt: true,
  dueWindowEnd: true,
  dueWindowStart: true,
  id: true,
  ownerType: true,
  status: true,
  title: true,
} satisfies Prisma.CommitmentSelect;

const relatedMeetingSelect = {
  createdAt: true,
  id: true,
  occurredAt: true,
  title: true,
} satisfies Prisma.MeetingSelect;

const relatedNoteSelect = {
  createdAt: true,
  id: true,
  noteType: true,
  sourceType: true,
  summary: true,
  updatedAt: true,
} satisfies Prisma.NoteSelect;

const relatedNeedSelect = {
  id: true,
  priority: true,
  status: true,
  title: true,
} satisfies Prisma.NeedSelect;

const relatedCapabilitySelect = {
  id: true,
  status: true,
  title: true,
} satisfies Prisma.CapabilitySelect;

const relatedIntroductionSelect = {
  id: true,
  status: true,
  rationale: true,
} satisfies Prisma.IntroductionSuggestionSelect;

const relatedProposalSelect = {
  id: true,
  proposalType: true,
  status: true,
  title: true,
} satisfies Prisma.AIProposalSelect;

export type RelationshipHealthPersonFacts = Awaited<
  ReturnType<typeof getPersonRelationshipHealthFacts>
>;
export type RelationshipHealthCompanyFacts = Awaited<
  ReturnType<typeof getCompanyRelationshipHealthFacts>
>;

export function listRelationshipHealthPeople(
  tenantId: string,
  db: RelationshipHealthClient = prisma,
) {
  return db.person.findMany({
    orderBy: { displayName: "asc" },
    select: {
      displayName: true,
      id: true,
    },
    where: {
      archivedAt: null,
      tenantId,
    },
  });
}

export function listRelationshipHealthCompanies(
  tenantId: string,
  db: RelationshipHealthClient = prisma,
) {
  return db.company.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
    where: {
      archivedAt: null,
      tenantId,
    },
  });
}

export async function getPersonRelationshipHealthFacts(
  input: {
    tenantId: string;
    personId: string;
  },
  db: RelationshipHealthClient = prisma,
) {
  const tenantFilter = { tenantId: input.tenantId };
  const openTaskWhere = {
    archivedAt: null,
    personId: input.personId,
    status: { in: OPEN_TASK_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.TaskWhereInput;
  const openCommitmentWhere = {
    archivedAt: null,
    OR: [
      { ownerPersonId: input.personId },
      { counterpartyPersonId: input.personId },
    ],
    status: { in: OPEN_COMMITMENT_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.CommitmentWhereInput;
  const activeNeedWhere = {
    archivedAt: null,
    personId: input.personId,
    status: { in: ACTIVE_NEED_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.NeedWhereInput;
  const activeCapabilityWhere = {
    archivedAt: null,
    personId: input.personId,
    status: { in: ACTIVE_CAPABILITY_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.CapabilityWhereInput;
  const activeIntroductionWhere = {
    archivedAt: null,
    OR: [
      { fromPersonId: input.personId },
      { toPersonId: input.personId },
    ],
    status: { in: ACTIVE_INTRODUCTION_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.IntroductionSuggestionWhereInput;
  const pendingProposalWhere = {
    archivedAt: null,
    OR: [
      {
        targetEntityId: input.personId,
        targetEntityType: "PERSON",
      },
      {
        sourceNote: {
          is: {
            archivedAt: null,
            personId: input.personId,
            ...tenantFilter,
          },
        },
      },
      {
        sourceMeeting: {
          is: {
            archivedAt: null,
            participants: {
              some: {
                personId: input.personId,
                tenantId: input.tenantId,
              },
            },
            ...tenantFilter,
          },
        },
      },
    ],
    status: { in: PENDING_PROPOSAL_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.AIProposalWhereInput;

  const [
    entity,
    meetings,
    notes,
    tasks,
    taskCount,
    commitments,
    commitmentCount,
    needs,
    needCount,
    capabilities,
    capabilityCount,
    introductions,
    introductionCount,
    proposals,
    proposalCount,
  ] = await Promise.all([
    db.person.findFirst({
      select: {
        displayName: true,
        id: true,
      },
      where: {
        archivedAt: null,
        id: input.personId,
        tenantId: input.tenantId,
      },
    }),
    db.meeting.findMany({
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      select: relatedMeetingSelect,
      take: 3,
      where: {
        archivedAt: null,
        participants: {
          some: {
            personId: input.personId,
            tenantId: input.tenantId,
          },
        },
        tenantId: input.tenantId,
      },
    }),
    db.note.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: relatedNoteSelect,
      take: 3,
      where: {
        archivedAt: null,
        personId: input.personId,
        tenantId: input.tenantId,
      },
    }),
    db.task.findMany({
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      select: relatedTaskSelect,
      take: 5,
      where: openTaskWhere,
    }),
    db.task.count({ where: openTaskWhere }),
    db.commitment.findMany({
      orderBy: [
        { dueAt: "asc" },
        { dueWindowEnd: "asc" },
        { createdAt: "desc" },
      ],
      select: relatedCommitmentSelect,
      take: 5,
      where: openCommitmentWhere,
    }),
    db.commitment.count({ where: openCommitmentWhere }),
    db.need.findMany({
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      select: relatedNeedSelect,
      take: 5,
      where: activeNeedWhere,
    }),
    db.need.count({ where: activeNeedWhere }),
    db.capability.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: relatedCapabilitySelect,
      take: 5,
      where: activeCapabilityWhere,
    }),
    db.capability.count({ where: activeCapabilityWhere }),
    db.introductionSuggestion.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: relatedIntroductionSelect,
      take: 5,
      where: activeIntroductionWhere,
    }),
    db.introductionSuggestion.count({ where: activeIntroductionWhere }),
    db.aIProposal.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: relatedProposalSelect,
      take: 5,
      where: pendingProposalWhere,
    }),
    db.aIProposal.count({ where: pendingProposalWhere }),
  ]);

  return {
    capabilities,
    capabilityCount,
    commitments,
    commitmentCount,
    entity,
    introductions,
    introductionCount,
    meetings,
    needs,
    needCount,
    notes,
    proposals,
    proposalCount,
    taskCount,
    tasks,
  };
}

export async function getCompanyRelationshipHealthFacts(
  input: {
    tenantId: string;
    companyId: string;
  },
  db: RelationshipHealthClient = prisma,
) {
  const tenantFilter = { tenantId: input.tenantId };
  const openTaskWhere = {
    archivedAt: null,
    companyId: input.companyId,
    status: { in: OPEN_TASK_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.TaskWhereInput;
  const openCommitmentWhere = {
    archivedAt: null,
    OR: [
      { ownerCompanyId: input.companyId },
      { counterpartyCompanyId: input.companyId },
    ],
    status: { in: OPEN_COMMITMENT_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.CommitmentWhereInput;
  const activeNeedWhere = {
    archivedAt: null,
    companyId: input.companyId,
    status: { in: ACTIVE_NEED_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.NeedWhereInput;
  const activeCapabilityWhere = {
    archivedAt: null,
    companyId: input.companyId,
    status: { in: ACTIVE_CAPABILITY_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.CapabilityWhereInput;
  const activeIntroductionWhere = {
    archivedAt: null,
    OR: [
      { fromCompanyId: input.companyId },
      { toCompanyId: input.companyId },
    ],
    status: { in: ACTIVE_INTRODUCTION_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.IntroductionSuggestionWhereInput;
  const pendingProposalWhere = {
    archivedAt: null,
    OR: [
      {
        targetEntityId: input.companyId,
        targetEntityType: "COMPANY",
      },
      {
        sourceNote: {
          is: {
            archivedAt: null,
            companyId: input.companyId,
            ...tenantFilter,
          },
        },
      },
      {
        sourceMeeting: {
          is: {
            archivedAt: null,
            OR: [
              { primaryCompanyId: input.companyId },
              {
                participants: {
                  some: {
                    companyId: input.companyId,
                    tenantId: input.tenantId,
                  },
                },
              },
            ],
            ...tenantFilter,
          },
        },
      },
    ],
    status: { in: PENDING_PROPOSAL_STATUSES },
    tenantId: input.tenantId,
  } satisfies Prisma.AIProposalWhereInput;

  const [
    entity,
    meetings,
    notes,
    tasks,
    taskCount,
    commitments,
    commitmentCount,
    needs,
    needCount,
    capabilities,
    capabilityCount,
    introductions,
    introductionCount,
    proposals,
    proposalCount,
  ] = await Promise.all([
    db.company.findFirst({
      select: {
        id: true,
        name: true,
      },
      where: {
        archivedAt: null,
        id: input.companyId,
        tenantId: input.tenantId,
      },
    }),
    db.meeting.findMany({
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      select: relatedMeetingSelect,
      take: 3,
      where: {
        archivedAt: null,
        OR: [
          { primaryCompanyId: input.companyId },
          {
            participants: {
              some: {
                companyId: input.companyId,
                tenantId: input.tenantId,
              },
            },
          },
        ],
        tenantId: input.tenantId,
      },
    }),
    db.note.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: relatedNoteSelect,
      take: 3,
      where: {
        archivedAt: null,
        companyId: input.companyId,
        tenantId: input.tenantId,
      },
    }),
    db.task.findMany({
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      select: relatedTaskSelect,
      take: 5,
      where: openTaskWhere,
    }),
    db.task.count({ where: openTaskWhere }),
    db.commitment.findMany({
      orderBy: [
        { dueAt: "asc" },
        { dueWindowEnd: "asc" },
        { createdAt: "desc" },
      ],
      select: relatedCommitmentSelect,
      take: 5,
      where: openCommitmentWhere,
    }),
    db.commitment.count({ where: openCommitmentWhere }),
    db.need.findMany({
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      select: relatedNeedSelect,
      take: 5,
      where: activeNeedWhere,
    }),
    db.need.count({ where: activeNeedWhere }),
    db.capability.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: relatedCapabilitySelect,
      take: 5,
      where: activeCapabilityWhere,
    }),
    db.capability.count({ where: activeCapabilityWhere }),
    db.introductionSuggestion.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: relatedIntroductionSelect,
      take: 5,
      where: activeIntroductionWhere,
    }),
    db.introductionSuggestion.count({ where: activeIntroductionWhere }),
    db.aIProposal.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: relatedProposalSelect,
      take: 5,
      where: pendingProposalWhere,
    }),
    db.aIProposal.count({ where: pendingProposalWhere }),
  ]);

  return {
    capabilities,
    capabilityCount,
    commitments,
    commitmentCount,
    entity,
    introductions,
    introductionCount,
    meetings,
    needs,
    needCount,
    notes,
    proposals,
    proposalCount,
    taskCount,
    tasks,
  };
}
