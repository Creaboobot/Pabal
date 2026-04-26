import type {
  AIProposalStatus,
  AIProposalType,
  CapabilityStatus,
  CapabilityType,
  CommitmentOwnerType,
  CommitmentStatus,
  IntroductionSuggestionStatus,
  MeetingParticipantRole,
  NeedStatus,
  NeedType,
  NoteType,
  RecordSourceType,
  Sensitivity,
  SourceEntityType,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";

import {
  findMeetingPrepBase,
  listMeetingPrepCapabilities,
  listMeetingPrepCommitments,
  listMeetingPrepCompanyNotes,
  listMeetingPrepIntroductions,
  listMeetingPrepNeeds,
  listMeetingPrepNotes,
  listMeetingPrepPersonNotes,
  listMeetingPrepProposals,
  listMeetingPrepRecentMeetings,
  listMeetingPrepSourceReferences,
  listMeetingPrepTasks,
  uniqueMeetingPrepIds,
  type MeetingPrepCapability,
  type MeetingPrepCommitment,
  type MeetingPrepNeed,
  type MeetingPrepNote,
  type MeetingPrepProposal,
  type MeetingPrepRecentMeeting,
  type MeetingPrepSourceReference,
  type MeetingPrepTask,
} from "@/server/repositories/meeting-prep";
import {
  getTenantCompanyRelationshipHealth,
  getTenantPersonRelationshipHealth,
  type RelationshipHealth,
} from "@/server/services/relationship-health";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

const MEETING_NOTE_LIMIT = 5;
const RELATED_RECORD_LIMIT = 8;
const RECENT_MEETING_LIMIT = 12;
const CONTEXT_NOTE_LIMIT = 24;
const SOURCE_REFERENCE_LIMIT = 8;
const CONTEXT_NOTE_PER_ENTITY_LIMIT = 3;

export type MeetingPrepLink = {
  entityId: string;
  entityType: SourceEntityType;
  href: string | null;
  label: string;
};

export type MeetingPrepNotePreview = {
  createdAt: Date;
  href: string;
  id: string;
  noteType: NoteType;
  preview: string;
  sensitivity: Sensitivity;
  sourceType: RecordSourceType;
  updatedAt: Date;
};

export type MeetingPrepRecentInteraction = {
  href: string;
  id: string;
  occurredAt: Date | null;
  primaryCompanyName: string | null;
  title: string;
};

export type MeetingPrepParticipantContext = {
  company: MeetingPrepLink | null;
  emailSnapshot: string | null;
  health: RelationshipHealth | null;
  id: string;
  isKnownPerson: boolean;
  name: string;
  participantRole: MeetingParticipantRole;
  person: MeetingPrepLink | null;
  recentNotes: MeetingPrepNotePreview[];
};

export type MeetingPrepCompanyContext = {
  health: RelationshipHealth | null;
  id: string;
  isPrimary: boolean;
  name: string;
  recentNotes: MeetingPrepNotePreview[];
};

export type MeetingPrepTaskRecord = {
  dueAt: Date | null;
  href: string;
  id: string;
  priority: TaskPriority;
  status: TaskStatus;
  taskType: TaskType;
  title: string;
};

export type MeetingPrepCommitmentRecord = {
  dueAt: Date | null;
  dueWindowEnd: Date | null;
  dueWindowStart: Date | null;
  href: string;
  id: string;
  ownerType: CommitmentOwnerType;
  sensitivity: Sensitivity;
  status: CommitmentStatus;
  title: string;
};

export type MeetingPrepNeedRecord = {
  confidence: number | null;
  href: string;
  id: string;
  needType: NeedType;
  priority: TaskPriority;
  sensitivity: Sensitivity;
  status: NeedStatus;
  title: string;
};

export type MeetingPrepCapabilityRecord = {
  capabilityType: CapabilityType;
  confidence: number | null;
  href: string;
  id: string;
  sensitivity: Sensitivity;
  status: CapabilityStatus;
  title: string;
};

export type MeetingPrepIntroductionRecord = {
  confidence: number | null;
  href: string;
  id: string;
  rationalePreview: string;
  status: IntroductionSuggestionStatus;
};

export type MeetingPrepProposalRecord = {
  confidence: number | null;
  href: string;
  id: string;
  proposalType: AIProposalType;
  reviewOnly: true;
  status: AIProposalStatus;
  title: string;
};

export type MeetingPrepSourceReferenceRecord = {
  confidence: number | null;
  createdAt: Date;
  id: string;
  label: string;
  reason: string | null;
  source: MeetingPrepLink;
  target: MeetingPrepLink;
};

export type MeetingPrepBrief = {
  companies: MeetingPrepCompanyContext[];
  meeting: {
    createdAt: Date;
    endedAt: Date | null;
    id: string;
    location: string | null;
    occurredAt: Date | null;
    primaryCompany: MeetingPrepLink | null;
    sourceType: RecordSourceType;
    summary: string | null;
    title: string;
    updatedAt: Date;
  };
  participants: MeetingPrepParticipantContext[];
  records: {
    capabilities: MeetingPrepCapabilityRecord[];
    commitments: MeetingPrepCommitmentRecord[];
    introductions: MeetingPrepIntroductionRecord[];
    needs: MeetingPrepNeedRecord[];
    notes: MeetingPrepNotePreview[];
    proposals: MeetingPrepProposalRecord[];
    recentMeetings: MeetingPrepRecentInteraction[];
    sourceReferences: MeetingPrepSourceReferenceRecord[];
    tasks: MeetingPrepTaskRecord[];
  };
};

function entityHref(entityType: SourceEntityType, entityId: string) {
  switch (entityType) {
    case "PERSON":
      return `/people/${entityId}`;
    case "COMPANY":
      return `/people/companies/${entityId}`;
    case "MEETING":
      return `/meetings/${entityId}`;
    case "NOTE":
      return `/notes/${entityId}`;
    case "TASK":
      return `/tasks/${entityId}`;
    case "COMMITMENT":
      return `/commitments/${entityId}`;
    case "NEED":
      return `/opportunities/needs/${entityId}`;
    case "CAPABILITY":
      return `/opportunities/capabilities/${entityId}`;
    case "INTRODUCTION_SUGGESTION":
      return `/opportunities/introductions/${entityId}`;
    case "AI_PROPOSAL":
      return `/proposals/${entityId}`;
    case "AI_PROPOSAL_ITEM":
    case "COMPANY_AFFILIATION":
    case "MEETING_PARTICIPANT":
    case "VOICE_MENTION":
    case "VOICE_NOTE":
      return null;
  }
}

function entityLabel(entityType: SourceEntityType, entityId: string) {
  switch (entityType) {
    case "AI_PROPOSAL":
      return "AI proposal";
    case "AI_PROPOSAL_ITEM":
      return "AI proposal item";
    case "CAPABILITY":
      return "Capability";
    case "COMMITMENT":
      return "Commitment";
    case "COMPANY":
      return "Company";
    case "COMPANY_AFFILIATION":
      return "Company affiliation";
    case "INTRODUCTION_SUGGESTION":
      return "Introduction suggestion";
    case "MEETING":
      return "Meeting";
    case "MEETING_PARTICIPANT":
      return "Meeting participant";
    case "NEED":
      return "Need";
    case "NOTE":
      return "Note";
    case "PERSON":
      return "Person";
    case "TASK":
      return "Task";
    case "VOICE_MENTION":
      return "Voice mention";
    case "VOICE_NOTE":
      return "Voice note";
  }
}

function sourceLink(entityType: SourceEntityType, entityId: string): MeetingPrepLink {
  return {
    entityId,
    entityType,
    href: entityHref(entityType, entityId),
    label: entityLabel(entityType, entityId),
  };
}

function truncate(text: string, max = 180) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function notePreview(note: MeetingPrepNote): MeetingPrepNotePreview {
  const text = note.summary?.trim() || note.body.trim() || "No preview yet.";

  return {
    createdAt: note.createdAt,
    href: `/notes/${note.id}`,
    id: note.id,
    noteType: note.noteType,
    preview: truncate(text),
    sensitivity: note.sensitivity,
    sourceType: note.sourceType,
    updatedAt: note.updatedAt,
  };
}

function groupNotesByEntity(
  notes: MeetingPrepNote[],
  key: "companyId" | "personId",
) {
  const grouped = new Map<string, MeetingPrepNotePreview[]>();

  for (const note of notes) {
    const entityId = note[key];

    if (!entityId) {
      continue;
    }

    const existing = grouped.get(entityId) ?? [];

    if (existing.length < CONTEXT_NOTE_PER_ENTITY_LIMIT) {
      existing.push(notePreview(note));
      grouped.set(entityId, existing);
    }
  }

  return grouped;
}

function mapRecentMeeting(
  meeting: MeetingPrepRecentMeeting,
): MeetingPrepRecentInteraction {
  return {
    href: `/meetings/${meeting.id}`,
    id: meeting.id,
    occurredAt: meeting.occurredAt,
    primaryCompanyName: meeting.primaryCompany?.name ?? null,
    title: meeting.title,
  };
}

function mapTask(task: MeetingPrepTask): MeetingPrepTaskRecord {
  return {
    dueAt: task.dueAt,
    href: `/tasks/${task.id}`,
    id: task.id,
    priority: task.priority,
    status: task.status,
    taskType: task.taskType,
    title: task.title,
  };
}

function mapCommitment(
  commitment: MeetingPrepCommitment,
): MeetingPrepCommitmentRecord {
  return {
    dueAt: commitment.dueAt,
    dueWindowEnd: commitment.dueWindowEnd,
    dueWindowStart: commitment.dueWindowStart,
    href: `/commitments/${commitment.id}`,
    id: commitment.id,
    ownerType: commitment.ownerType,
    sensitivity: commitment.sensitivity,
    status: commitment.status,
    title: commitment.title,
  };
}

function mapNeed(need: MeetingPrepNeed): MeetingPrepNeedRecord {
  return {
    confidence: need.confidence,
    href: `/opportunities/needs/${need.id}`,
    id: need.id,
    needType: need.needType,
    priority: need.priority,
    sensitivity: need.sensitivity,
    status: need.status,
    title: need.title,
  };
}

function mapCapability(
  capability: MeetingPrepCapability,
): MeetingPrepCapabilityRecord {
  return {
    capabilityType: capability.capabilityType,
    confidence: capability.confidence,
    href: `/opportunities/capabilities/${capability.id}`,
    id: capability.id,
    sensitivity: capability.sensitivity,
    status: capability.status,
    title: capability.title,
  };
}

function mapIntroduction(
  introduction: {
    confidence: number | null;
    id: string;
    rationale: string;
    status: IntroductionSuggestionStatus;
  },
): MeetingPrepIntroductionRecord {
  return {
    confidence: introduction.confidence,
    href: `/opportunities/introductions/${introduction.id}`,
    id: introduction.id,
    rationalePreview: truncate(introduction.rationale, 120),
    status: introduction.status,
  };
}

function mapProposal(proposal: MeetingPrepProposal): MeetingPrepProposalRecord {
  return {
    confidence: proposal.confidence,
    href: `/proposals/${proposal.id}`,
    id: proposal.id,
    proposalType: proposal.proposalType,
    reviewOnly: true,
    status: proposal.status,
    title: proposal.title,
  };
}

function mapSourceReference(
  reference: MeetingPrepSourceReference,
): MeetingPrepSourceReferenceRecord {
  return {
    confidence: reference.confidence,
    createdAt: reference.createdAt,
    id: reference.id,
    label: reference.label ?? "Source reference",
    reason: reference.reason,
    source: sourceLink(reference.sourceEntityType, reference.sourceEntityId),
    target: sourceLink(reference.targetEntityType, reference.targetEntityId),
  };
}

export async function getTenantMeetingPrepBrief(
  context: TenantContext,
  meetingId: string,
): Promise<MeetingPrepBrief | null> {
  await requireTenantAccess(context);

  const meeting = await findMeetingPrepBase({
    meetingId,
    tenantId: context.tenantId,
  });

  if (!meeting) {
    return null;
  }

  const personIds = uniqueMeetingPrepIds(
    meeting.participants.map((participant) => participant.personId),
  );
  const companyIds = uniqueMeetingPrepIds([
    meeting.primaryCompanyId,
    ...meeting.participants.map((participant) => participant.companyId),
  ]);

  const [meetingNotes, personNotes, companyNotes, recentMeetings] =
    await Promise.all([
      listMeetingPrepNotes({
        meetingId,
        take: MEETING_NOTE_LIMIT,
        tenantId: context.tenantId,
      }),
      listMeetingPrepPersonNotes({
        personIds,
        take: CONTEXT_NOTE_LIMIT,
        tenantId: context.tenantId,
      }),
      listMeetingPrepCompanyNotes({
        companyIds,
        take: CONTEXT_NOTE_LIMIT,
        tenantId: context.tenantId,
      }),
      listMeetingPrepRecentMeetings({
        companyIds,
        meetingId,
        personIds,
        take: RECENT_MEETING_LIMIT,
        tenantId: context.tenantId,
      }),
    ]);
  const noteIds = uniqueMeetingPrepIds([
    ...meetingNotes.map((note) => note.id),
    ...personNotes.map((note) => note.id),
    ...companyNotes.map((note) => note.id),
  ]);

  const [tasks, commitments, needs, capabilities, proposals, sourceReferences] =
    await Promise.all([
      listMeetingPrepTasks({
        companyIds,
        meetingId,
        noteIds,
        personIds,
        take: RELATED_RECORD_LIMIT,
        tenantId: context.tenantId,
      }),
      listMeetingPrepCommitments({
        companyIds,
        meetingId,
        noteIds,
        personIds,
        take: RELATED_RECORD_LIMIT,
        tenantId: context.tenantId,
      }),
      listMeetingPrepNeeds({
        companyIds,
        meetingId,
        noteIds,
        personIds,
        take: RELATED_RECORD_LIMIT,
        tenantId: context.tenantId,
      }),
      listMeetingPrepCapabilities({
        companyIds,
        noteIds,
        personIds,
        take: RELATED_RECORD_LIMIT,
        tenantId: context.tenantId,
      }),
      listMeetingPrepProposals({
        companyIds,
        meetingId,
        noteIds,
        personIds,
        take: RELATED_RECORD_LIMIT,
        tenantId: context.tenantId,
      }),
      listMeetingPrepSourceReferences({
        meetingId,
        take: SOURCE_REFERENCE_LIMIT,
        tenantId: context.tenantId,
      }),
    ]);
  const introductions = await listMeetingPrepIntroductions({
    capabilityIds: uniqueMeetingPrepIds(
      capabilities.map((capability) => capability.id),
    ),
    companyIds,
    needIds: uniqueMeetingPrepIds(needs.map((need) => need.id)),
    personIds,
    take: RELATED_RECORD_LIMIT,
    tenantId: context.tenantId,
  });

  const [personHealthEntries, companyHealthEntries] = await Promise.all([
    Promise.all(
      personIds.map(async (personId) => [
        personId,
        await getTenantPersonRelationshipHealth(context, personId),
      ] as const),
    ),
    Promise.all(
      companyIds.map(async (companyId) => [
        companyId,
        await getTenantCompanyRelationshipHealth(context, companyId),
      ] as const),
    ),
  ]);
  const personHealth = new Map(personHealthEntries);
  const companyHealth = new Map(companyHealthEntries);
  const personNotesById = groupNotesByEntity(personNotes, "personId");
  const companyNotesById = groupNotesByEntity(companyNotes, "companyId");
  const companyMap = new Map<
    string,
    {
      id: string;
      isPrimary: boolean;
      name: string;
    }
  >();

  if (meeting.primaryCompany) {
    companyMap.set(meeting.primaryCompany.id, {
      id: meeting.primaryCompany.id,
      isPrimary: true,
      name: meeting.primaryCompany.name,
    });
  }

  for (const participant of meeting.participants) {
    if (participant.company) {
      const existing = companyMap.get(participant.company.id);

      companyMap.set(participant.company.id, {
        id: participant.company.id,
        isPrimary: existing?.isPrimary ?? false,
        name: participant.company.name,
      });
    }
  }

  return {
    companies: [...companyMap.values()].map((company) => ({
      health: companyHealth.get(company.id) ?? null,
      id: company.id,
      isPrimary: company.isPrimary,
      name: company.name,
      recentNotes: companyNotesById.get(company.id) ?? [],
    })),
    meeting: {
      createdAt: meeting.createdAt,
      endedAt: meeting.endedAt,
      id: meeting.id,
      location: meeting.location,
      occurredAt: meeting.occurredAt,
      primaryCompany: meeting.primaryCompany
        ? {
            entityId: meeting.primaryCompany.id,
            entityType: "COMPANY",
            href: `/people/companies/${meeting.primaryCompany.id}`,
            label: meeting.primaryCompany.name,
          }
        : null,
      sourceType: meeting.sourceType,
      summary: meeting.summary,
      title: meeting.title,
      updatedAt: meeting.updatedAt,
    },
    participants: meeting.participants.map((participant) => ({
      company: participant.company
        ? {
            entityId: participant.company.id,
            entityType: "COMPANY",
            href: `/people/companies/${participant.company.id}`,
            label: participant.company.name,
          }
        : null,
      emailSnapshot: participant.emailSnapshot,
      health: participant.personId
        ? personHealth.get(participant.personId) ?? null
        : null,
      id: participant.id,
      isKnownPerson: Boolean(participant.personId),
      name:
        participant.person?.displayName ??
        participant.nameSnapshot ??
        "Snapshot participant",
      participantRole: participant.participantRole,
      person: participant.person
        ? {
            entityId: participant.person.id,
            entityType: "PERSON",
            href: `/people/${participant.person.id}`,
            label: participant.person.displayName,
          }
        : null,
      recentNotes: participant.personId
        ? personNotesById.get(participant.personId) ?? []
        : [],
    })),
    records: {
      capabilities: capabilities.map(mapCapability),
      commitments: commitments.map(mapCommitment),
      introductions: introductions.map(mapIntroduction),
      needs: needs.map(mapNeed),
      notes: meetingNotes.map(notePreview),
      proposals: proposals.map(mapProposal),
      recentMeetings: recentMeetings.map(mapRecentMeeting),
      sourceReferences: sourceReferences.map(mapSourceReference),
      tasks: tasks.map(mapTask),
    },
  };
}
