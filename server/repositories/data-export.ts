import { type Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type ExportClient = PrismaClient | Prisma.TransactionClient;

export type ExportSection<T> = {
  records: T[];
  truncated: boolean;
};

const userSafeSelect = {
  email: true,
  id: true,
  image: true,
  name: true,
} satisfies Prisma.UserSelect;

const roleSafeSelect = {
  description: true,
  id: true,
  key: true,
  name: true,
} satisfies Prisma.RoleSelect;

const membershipSelect = {
  createdAt: true,
  id: true,
  role: {
    select: roleSafeSelect,
  },
  roleId: true,
  status: true,
  tenantId: true,
  updatedAt: true,
  user: {
    select: userSafeSelect,
  },
  userId: true,
} satisfies Prisma.MembershipSelect;

const auditLogSelect = {
  action: true,
  actor: {
    select: userSafeSelect,
  },
  actorUserId: true,
  createdAt: true,
  entityId: true,
  entityType: true,
  id: true,
  metadata: true,
  tenantId: true,
} satisfies Prisma.AuditLogSelect;

const personSelect = {
  archivedAt: true,
  createdAt: true,
  createdByUserId: true,
  displayName: true,
  email: true,
  firstName: true,
  id: true,
  jobTitle: true,
  lastName: true,
  linkedinUrl: true,
  phone: true,
  relationshipStatus: true,
  relationshipTemperature: true,
  salesNavigatorUrl: true,
  tenantId: true,
  updatedAt: true,
  updatedByUserId: true,
} satisfies Prisma.PersonSelect;

const companySelect = {
  archivedAt: true,
  createdAt: true,
  createdByUserId: true,
  description: true,
  id: true,
  industry: true,
  name: true,
  normalizedName: true,
  tenantId: true,
  updatedAt: true,
  updatedByUserId: true,
  website: true,
} satisfies Prisma.CompanySelect;

const companyAffiliationSelect = {
  affiliationTitle: true,
  archivedAt: true,
  companyId: true,
  createdAt: true,
  createdByUserId: true,
  department: true,
  endsAt: true,
  id: true,
  isPrimary: true,
  personId: true,
  startsAt: true,
  tenantId: true,
  updatedAt: true,
  updatedByUserId: true,
} satisfies Prisma.CompanyAffiliationSelect;

const meetingSelect = {
  archivedAt: true,
  createdAt: true,
  createdByUserId: true,
  endedAt: true,
  id: true,
  location: true,
  occurredAt: true,
  primaryCompanyId: true,
  sourceType: true,
  summary: true,
  tenantId: true,
  title: true,
  updatedAt: true,
  updatedByUserId: true,
} satisfies Prisma.MeetingSelect;

const meetingParticipantSelect = {
  companyId: true,
  createdAt: true,
  createdByUserId: true,
  emailSnapshot: true,
  id: true,
  meetingId: true,
  nameSnapshot: true,
  participantRole: true,
  personId: true,
  tenantId: true,
  updatedAt: true,
  updatedByUserId: true,
} satisfies Prisma.MeetingParticipantSelect;

const noteSelect = {
  archivedAt: true,
  body: true,
  companyId: true,
  createdAt: true,
  createdByUserId: true,
  id: true,
  meetingId: true,
  noteType: true,
  personId: true,
  sensitivity: true,
  sourceType: true,
  summary: true,
  tenantId: true,
  updatedAt: true,
  updatedByUserId: true,
} satisfies Prisma.NoteSelect;

const taskSelect = {
  archivedAt: true,
  commitmentId: true,
  companyId: true,
  completedAt: true,
  confidence: true,
  createdAt: true,
  createdByUserId: true,
  description: true,
  dueAt: true,
  id: true,
  introductionSuggestionId: true,
  meetingId: true,
  noteId: true,
  personId: true,
  priority: true,
  reminderAt: true,
  snoozedUntil: true,
  status: true,
  taskType: true,
  tenantId: true,
  title: true,
  updatedAt: true,
  updatedByUserId: true,
  whyNowRationale: true,
} satisfies Prisma.TaskSelect;

const commitmentSelect = {
  archivedAt: true,
  counterpartyCompanyId: true,
  counterpartyPersonId: true,
  createdAt: true,
  createdByUserId: true,
  description: true,
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
  tenantId: true,
  title: true,
  updatedAt: true,
  updatedByUserId: true,
} satisfies Prisma.CommitmentSelect;

const needSelect = {
  archivedAt: true,
  companyId: true,
  confidence: true,
  createdAt: true,
  createdByUserId: true,
  description: true,
  id: true,
  meetingId: true,
  needType: true,
  noteId: true,
  personId: true,
  priority: true,
  sensitivity: true,
  status: true,
  tenantId: true,
  title: true,
  updatedAt: true,
  updatedByUserId: true,
} satisfies Prisma.NeedSelect;

const capabilitySelect = {
  archivedAt: true,
  capabilityType: true,
  companyId: true,
  confidence: true,
  createdAt: true,
  createdByUserId: true,
  description: true,
  id: true,
  noteId: true,
  personId: true,
  sensitivity: true,
  status: true,
  tenantId: true,
  title: true,
  updatedAt: true,
  updatedByUserId: true,
} satisfies Prisma.CapabilitySelect;

const introductionSuggestionSelect = {
  archivedAt: true,
  capabilityId: true,
  confidence: true,
  createdAt: true,
  createdByUserId: true,
  fromCompanyId: true,
  fromPersonId: true,
  id: true,
  needId: true,
  rationale: true,
  status: true,
  tenantId: true,
  toCompanyId: true,
  toPersonId: true,
  updatedAt: true,
  updatedByUserId: true,
} satisfies Prisma.IntroductionSuggestionSelect;

const aiProposalSelect = {
  archivedAt: true,
  confidence: true,
  createdAt: true,
  createdByUserId: true,
  explanation: true,
  id: true,
  proposalType: true,
  reviewNote: true,
  reviewedAt: true,
  reviewedByUserId: true,
  sourceMeetingId: true,
  sourceNoteId: true,
  sourceVoiceNoteId: true,
  status: true,
  summary: true,
  targetEntityId: true,
  targetEntityType: true,
  tenantId: true,
  title: true,
  updatedAt: true,
} satisfies Prisma.AIProposalSelect;

const aiProposalItemSelect = {
  actionType: true,
  aiProposalId: true,
  archivedAt: true,
  confidence: true,
  createdAt: true,
  createdByUserId: true,
  explanation: true,
  id: true,
  proposedPatch: true,
  reviewNote: true,
  reviewedAt: true,
  reviewedByUserId: true,
  status: true,
  targetEntityId: true,
  targetEntityType: true,
  tenantId: true,
  updatedAt: true,
} satisfies Prisma.AIProposalItemSelect;

const voiceNoteSelect = {
  archivedAt: true,
  audioDurationSeconds: true,
  audioMimeType: true,
  audioRetentionStatus: true,
  audioSizeBytes: true,
  companyId: true,
  createdAt: true,
  createdByUserId: true,
  editedTranscriptText: true,
  id: true,
  language: true,
  meetingId: true,
  noteId: true,
  personId: true,
  rawAudioDeletedAt: true,
  retentionExpiresAt: true,
  status: true,
  tenantId: true,
  title: true,
  transcriptConfidence: true,
  transcriptText: true,
  updatedAt: true,
  updatedByUserId: true,
} satisfies Prisma.VoiceNoteSelect;

const voiceMentionSelect = {
  archivedAt: true,
  confidence: true,
  confirmedAt: true,
  confirmedByUserId: true,
  createdAt: true,
  createdByUserId: true,
  endChar: true,
  id: true,
  mentionText: true,
  mentionType: true,
  requiresUserConfirmation: true,
  resolvedEntityId: true,
  resolvedEntityType: true,
  startChar: true,
  tenantId: true,
  updatedAt: true,
  updatedByUserId: true,
  voiceNoteId: true,
} satisfies Prisma.VoiceMentionSelect;

const sourceReferenceSelect = {
  confidence: true,
  createdAt: true,
  createdByUserId: true,
  id: true,
  label: true,
  reason: true,
  sourceEntityId: true,
  sourceEntityType: true,
  targetEntityId: true,
  targetEntityType: true,
  tenantId: true,
} satisfies Prisma.SourceReferenceSelect;

async function limited<T>(
  recordsPromise: Promise<T[]>,
  limit: number,
): Promise<ExportSection<T>> {
  const records = await recordsPromise;

  return {
    records: records.slice(0, limit),
    truncated: records.length > limit,
  };
}

function createdByWhere(tenantId: string, userId: string) {
  return {
    createdByUserId: userId,
    tenantId,
  };
}

export async function getExportRequestMetadata(
  input: {
    tenantId: string;
    userId: string;
  },
  db: ExportClient = prisma,
) {
  const [tenant, user, membership] = await Promise.all([
    db.tenant.findUniqueOrThrow({
      where: {
        id: input.tenantId,
      },
      select: {
        createdAt: true,
        id: true,
        name: true,
        slug: true,
        updatedAt: true,
      },
    }),
    db.user.findUniqueOrThrow({
      where: {
        id: input.userId,
      },
      select: {
        ...userSafeSelect,
        createdAt: true,
        emailVerified: true,
        updatedAt: true,
      },
    }),
    db.membership.findUniqueOrThrow({
      where: {
        tenantId_userId: {
          tenantId: input.tenantId,
          userId: input.userId,
        },
      },
      select: membershipSelect,
    }),
  ]);

  return {
    membership,
    tenant,
    user,
  };
}

export async function getTenantPersonalExportSections(
  input: {
    limit: number;
    tenantId: string;
    userId: string;
  },
  db: ExportClient = prisma,
) {
  const take = input.limit + 1;
  const where = createdByWhere(input.tenantId, input.userId);
  const orderBy = {
    createdAt: "asc" as const,
  };

  const [
    people,
    companies,
    affiliations,
    meetings,
    participants,
    notes,
    tasks,
    commitments,
    needs,
    capabilities,
    introductions,
    aiProposals,
    aiProposalItems,
    voiceNotes,
    voiceMentions,
    sourceReferences,
    auditLogs,
  ] = await Promise.all([
    limited(
      db.person.findMany({
        orderBy,
        select: personSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.company.findMany({
        orderBy,
        select: companySelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.companyAffiliation.findMany({
        orderBy,
        select: companyAffiliationSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.meeting.findMany({
        orderBy,
        select: meetingSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.meetingParticipant.findMany({
        orderBy,
        select: meetingParticipantSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.note.findMany({
        orderBy,
        select: noteSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.task.findMany({
        orderBy,
        select: taskSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.commitment.findMany({
        orderBy,
        select: commitmentSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.need.findMany({
        orderBy,
        select: needSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.capability.findMany({
        orderBy,
        select: capabilitySelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.introductionSuggestion.findMany({
        orderBy,
        select: introductionSuggestionSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.aIProposal.findMany({
        orderBy,
        select: aiProposalSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.aIProposalItem.findMany({
        orderBy,
        select: aiProposalItemSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.voiceNote.findMany({
        orderBy,
        select: voiceNoteSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.voiceMention.findMany({
        orderBy,
        select: voiceMentionSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.sourceReference.findMany({
        orderBy,
        select: sourceReferenceSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.auditLog.findMany({
        orderBy,
        select: auditLogSelect,
        take,
        where: {
          actorUserId: input.userId,
          tenantId: input.tenantId,
        },
      }),
      input.limit,
    ),
  ]);

  return {
    aiProposalItems,
    aiProposals,
    auditLogs,
    capabilities,
    commitments,
    companies,
    companyAffiliations: affiliations,
    introductionSuggestions: introductions,
    meetingParticipants: participants,
    meetings,
    needs,
    notes,
    people,
    sourceReferences,
    tasks,
    voiceMentions,
    voiceNotes,
  };
}

export async function getTenantWorkspaceExportSections(
  input: {
    limit: number;
    tenantId: string;
  },
  db: ExportClient = prisma,
) {
  const take = input.limit + 1;
  const where = {
    tenantId: input.tenantId,
  };
  const orderBy = {
    createdAt: "asc" as const,
  };

  const [
    memberships,
    people,
    companies,
    affiliations,
    meetings,
    participants,
    notes,
    tasks,
    commitments,
    needs,
    capabilities,
    introductions,
    aiProposals,
    aiProposalItems,
    voiceNotes,
    voiceMentions,
    sourceReferences,
    auditLogs,
  ] = await Promise.all([
    limited(
      db.membership.findMany({
        orderBy,
        select: membershipSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.person.findMany({
        orderBy,
        select: personSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.company.findMany({
        orderBy,
        select: companySelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.companyAffiliation.findMany({
        orderBy,
        select: companyAffiliationSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.meeting.findMany({
        orderBy,
        select: meetingSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.meetingParticipant.findMany({
        orderBy,
        select: meetingParticipantSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.note.findMany({
        orderBy,
        select: noteSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.task.findMany({
        orderBy,
        select: taskSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.commitment.findMany({
        orderBy,
        select: commitmentSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.need.findMany({
        orderBy,
        select: needSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.capability.findMany({
        orderBy,
        select: capabilitySelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.introductionSuggestion.findMany({
        orderBy,
        select: introductionSuggestionSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.aIProposal.findMany({
        orderBy,
        select: aiProposalSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.aIProposalItem.findMany({
        orderBy,
        select: aiProposalItemSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.voiceNote.findMany({
        orderBy,
        select: voiceNoteSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.voiceMention.findMany({
        orderBy,
        select: voiceMentionSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.sourceReference.findMany({
        orderBy,
        select: sourceReferenceSelect,
        take,
        where,
      }),
      input.limit,
    ),
    limited(
      db.auditLog.findMany({
        orderBy,
        select: auditLogSelect,
        take,
        where,
      }),
      input.limit,
    ),
  ]);

  return {
    aiProposalItems,
    aiProposals,
    auditLogs,
    capabilities,
    commitments,
    companies,
    companyAffiliations: affiliations,
    introductionSuggestions: introductions,
    meetingParticipants: participants,
    meetings,
    memberships,
    needs,
    notes,
    people,
    sourceReferences,
    tasks,
    voiceMentions,
    voiceNotes,
  };
}
