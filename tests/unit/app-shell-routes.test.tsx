import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTenantCompanyProfile: vi.fn(),
  getTenantPersonProfile: vi.fn(),
  getTenantPersonRelatedContext: vi.fn(),
  getTenantCompanyRelatedContext: vi.fn(),
  getTenantCompanyRelationshipHealth: vi.fn(),
  getTenantCompanyAffiliationForPerson: vi.fn(),
  getTenantCommitment: vi.fn(),
  getTenantCommitmentBoard: vi.fn(),
  getTenantCommitmentFormOptions: vi.fn(),
  getTenantCommitmentProfile: vi.fn(),
  getTenantAIProposalProfile: vi.fn(),
  getTenantAIProposalReviewSummary: vi.fn(),
  getTenantMeeting: vi.fn(),
  getTenantMeetingPrepBrief: vi.fn(),
  getTenantMeetingProfile: vi.fn(),
  getTenantCapabilityProfile: vi.fn(),
  getTenantIntroductionSuggestionProfile: vi.fn(),
  getTenantNeedProfile: vi.fn(),
  getTenantNote: vi.fn(),
  getTenantNoteProfile: vi.fn(),
  getTenantOpportunityFormOptions: vi.fn(),
  getTenantOpportunityHub: vi.fn(),
  getTenantPersonRelationshipHealth: vi.fn(),
  getTenantRelationshipAttentionBoard: vi.fn(),
  getTenantTaskBoard: vi.fn(),
  getTenantTaskFormOptions: vi.fn(),
  getTenantTaskProfile: vi.fn(),
  getTenantVoiceNoteProfile: vi.fn(),
  getAppShellSummary: vi.fn(),
  getCurrentUserContext: vi.fn(),
  getTenantCompany: vi.fn(),
  getTenantPerson: vi.fn(),
  listTenantCompaniesWithProfiles: vi.fn(),
  listTenantCompanies: vi.fn(),
  listTenantMeetings: vi.fn(),
  listTenantNotes: vi.fn(),
  listTenantCapabilitiesWithContext: vi.fn(),
  listTenantIntroductionSuggestionsWithContext: vi.fn(),
  listTenantNeedsWithContext: vi.fn(),
  listTenantAIProposals: vi.fn(),
  listTenantPeopleWithProfiles: vi.fn(),
  listTenantPeople: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("notFound");
  }),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
  signOut: vi.fn(),
  listTenantSourceReferencesForTarget: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
  usePathname: () => "/today",
}));

vi.mock("@/auth", () => ({
  signOut: mocks.signOut,
}));

vi.mock("@/server/services/session", () => ({
  getCurrentUserContext: mocks.getCurrentUserContext,
}));

vi.mock("@/server/services/app-shell-summary", () => ({
  getAppShellSummary: mocks.getAppShellSummary,
}));

vi.mock("@/server/services/people", () => ({
  getTenantPerson: mocks.getTenantPerson,
  getTenantPersonProfile: mocks.getTenantPersonProfile,
  listTenantPeople: mocks.listTenantPeople,
  listTenantPeopleWithProfiles: mocks.listTenantPeopleWithProfiles,
}));

vi.mock("@/server/services/companies", () => ({
  getTenantCompany: mocks.getTenantCompany,
  getTenantCompanyProfile: mocks.getTenantCompanyProfile,
  listTenantCompanies: mocks.listTenantCompanies,
  listTenantCompaniesWithProfiles: mocks.listTenantCompaniesWithProfiles,
}));

vi.mock("@/server/services/company-affiliations", () => ({
  getTenantCompanyAffiliationForPerson:
    mocks.getTenantCompanyAffiliationForPerson,
}));

vi.mock("@/server/services/meetings", () => ({
  getTenantMeeting: mocks.getTenantMeeting,
  getTenantMeetingProfile: mocks.getTenantMeetingProfile,
  listTenantMeetings: mocks.listTenantMeetings,
}));

vi.mock("@/server/services/meeting-prep", () => ({
  getTenantMeetingPrepBrief: mocks.getTenantMeetingPrepBrief,
}));

vi.mock("@/server/services/notes", () => ({
  getTenantNote: mocks.getTenantNote,
  getTenantNoteProfile: mocks.getTenantNoteProfile,
  listTenantNotes: mocks.listTenantNotes,
}));

vi.mock("@/server/services/voice-notes", () => ({
  getTenantVoiceNoteProfile: mocks.getTenantVoiceNoteProfile,
}));

vi.mock("@/server/services/needs", () => ({
  getTenantNeedProfile: mocks.getTenantNeedProfile,
  listTenantNeedsWithContext: mocks.listTenantNeedsWithContext,
}));

vi.mock("@/server/services/capabilities", () => ({
  getTenantCapabilityProfile: mocks.getTenantCapabilityProfile,
  listTenantCapabilitiesWithContext: mocks.listTenantCapabilitiesWithContext,
}));

vi.mock("@/server/services/introduction-suggestions", () => ({
  getTenantIntroductionSuggestionProfile:
    mocks.getTenantIntroductionSuggestionProfile,
  listTenantIntroductionSuggestionsWithContext:
    mocks.listTenantIntroductionSuggestionsWithContext,
}));

vi.mock("@/server/services/opportunities", () => ({
  getTenantOpportunityHub: mocks.getTenantOpportunityHub,
}));

vi.mock("@/server/services/opportunity-form-options", () => ({
  getTenantOpportunityFormOptions: mocks.getTenantOpportunityFormOptions,
}));

vi.mock("@/server/services/source-references", () => ({
  listTenantSourceReferencesForTarget: mocks.listTenantSourceReferencesForTarget,
}));

vi.mock("@/server/services/tasks", () => ({
  getTenantTaskBoard: mocks.getTenantTaskBoard,
  getTenantTaskProfile: mocks.getTenantTaskProfile,
}));

vi.mock("@/server/services/commitments", () => ({
  getTenantCommitment: mocks.getTenantCommitment,
  getTenantCommitmentBoard: mocks.getTenantCommitmentBoard,
  getTenantCommitmentProfile: mocks.getTenantCommitmentProfile,
}));

vi.mock("@/server/services/ai-proposals", () => ({
  getTenantAIProposalProfile: mocks.getTenantAIProposalProfile,
  getTenantAIProposalReviewSummary: mocks.getTenantAIProposalReviewSummary,
  listTenantAIProposals: mocks.listTenantAIProposals,
}));

vi.mock("@/server/services/task-form-options", () => ({
  getTenantTaskFormOptions: mocks.getTenantTaskFormOptions,
}));

vi.mock("@/server/services/commitment-form-options", () => ({
  getTenantCommitmentFormOptions: mocks.getTenantCommitmentFormOptions,
}));

vi.mock("@/server/services/relationship-context", () => ({
  getTenantCompanyRelatedContext: mocks.getTenantCompanyRelatedContext,
  getTenantPersonRelatedContext: mocks.getTenantPersonRelatedContext,
}));

vi.mock("@/server/services/relationship-health", () => ({
  getTenantCompanyRelationshipHealth: mocks.getTenantCompanyRelationshipHealth,
  getTenantPersonRelationshipHealth: mocks.getTenantPersonRelationshipHealth,
  getTenantRelationshipAttentionBoard: mocks.getTenantRelationshipAttentionBoard,
}));

vi.mock("@/modules/people/actions", () => ({
  archiveAffiliationAction: vi.fn(),
  archiveCompanyAction: vi.fn(),
  archivePersonAction: vi.fn(),
  createCompanyAffiliationAction: vi.fn(),
  createPersonAffiliationAction: vi.fn(),
  endAffiliationAction: vi.fn(),
  updateAffiliationAction: vi.fn(),
}));

vi.mock("@/modules/people/components/archive-record-button", () => ({
  ArchiveRecordButton: () => <div>Archive control</div>,
}));

vi.mock("@/modules/people/components/affiliation-action-button", () => ({
  AffiliationActionButton: () => <div>Affiliation lifecycle control</div>,
}));

vi.mock("@/modules/people/components/person-form", () => ({
  PersonForm: () => <form aria-label="Person form" />,
}));

vi.mock("@/modules/people/components/company-form", () => ({
  CompanyForm: () => <form aria-label="Company form" />,
}));

vi.mock("@/modules/people/components/affiliation-form", () => ({
  AffiliationForm: () => <form aria-label="Affiliation form" />,
}));

vi.mock("@/modules/meetings/components/meeting-form", () => ({
  MeetingForm: () => <form aria-label="Meeting form" />,
}));

vi.mock("@/modules/meetings/components/meeting-participant-form", () => ({
  MeetingParticipantForm: () => <form aria-label="Meeting participant form" />,
}));

vi.mock("@/modules/meetings/components/meeting-action-button", () => ({
  MeetingActionButton: () => <div>Meeting lifecycle control</div>,
}));

vi.mock("@/modules/meetings/components/participant-card", () => ({
  ParticipantCard: () => <article>Participant card</article>,
}));

vi.mock("@/modules/notes/components/note-form", () => ({
  NoteForm: () => <form aria-label="Note form" />,
}));

vi.mock("@/modules/notes/components/pasted-meeting-capture-form", () => ({
  PastedMeetingCaptureForm: () => <form aria-label="Pasted meeting form" />,
}));

vi.mock("@/modules/notes/components/note-action-button", () => ({
  NoteActionButton: () => <div>Note lifecycle control</div>,
}));

vi.mock("@/modules/voice-notes/components/voice-recorder", () => ({
  VoiceRecorder: () => <section aria-label="Voice recorder" />,
}));

vi.mock("@/modules/voice-notes/components/voice-note-form", () => ({
  VoiceNoteForm: () => <form aria-label="Voice note form" />,
}));

vi.mock("@/modules/voice-notes/components/voice-note-action-button", () => ({
  VoiceNoteActionButton: () => <div>Voice note lifecycle control</div>,
}));

vi.mock("@/modules/tasks/components/task-form", () => ({
  TaskForm: () => <form aria-label="Task form" />,
}));

vi.mock("@/modules/tasks/components/task-action-button", () => ({
  TaskActionButton: () => <div>Task lifecycle control</div>,
}));

vi.mock("@/modules/commitments/components/commitment-form", () => ({
  CommitmentForm: () => <form aria-label="Commitment form" />,
}));

vi.mock("@/modules/commitments/components/commitment-action-button", () => ({
  CommitmentActionButton: () => <div>Commitment lifecycle control</div>,
}));

vi.mock("@/modules/proposals/components/proposal-action-button", () => ({
  ProposalActionButton: () => <div>Proposal review control</div>,
}));

vi.mock("@/modules/opportunities/components/need-form", () => ({
  NeedForm: () => <form aria-label="Need form" />,
}));

vi.mock("@/modules/opportunities/components/capability-form", () => ({
  CapabilityForm: () => <form aria-label="Capability form" />,
}));

vi.mock("@/modules/opportunities/components/introduction-suggestion-form", () => ({
  IntroductionSuggestionForm: () => (
    <form aria-label="Introduction suggestion form" />
  ),
}));

vi.mock("@/modules/opportunities/components/opportunity-action-button", () => ({
  OpportunityActionButton: () => <div>Opportunity lifecycle control</div>,
}));

const tenantContext = {
  userId: "user_test_1",
  tenantId: "tenant_test_1",
  tenantName: "Demo Workspace",
  roleKey: "OWNER",
};

const appSummary = {
  action: {
    openTasks: 1,
    openCommitments: 1,
    pendingProposals: 1,
    upcomingMeetings: 1,
  },
  capture: {
    notes: 2,
    pendingProposals: 1,
    voiceNotes: 1,
  },
  people: {
    companies: 2,
    people: 4,
  },
  opportunities: {
    capabilities: 1,
    introductionSuggestions: 1,
    needs: 1,
  },
};

const personProfile = {
  _count: {
    meetingParticipants: 1,
    notes: 2,
  },
  companyAffiliations: [],
  displayName: "Anna Keller",
  email: "anna@example.com",
  firstName: "Anna",
  id: "person_test_1",
  jobTitle: "Partner",
  lastName: "Keller",
  phone: "+4512345678",
  relationshipStatus: "ACTIVE",
  relationshipTemperature: "WARM",
};

const companyProfile = {
  _count: {
    notes: 1,
    primaryMeetings: 1,
  },
  companyAffiliations: [],
  description: "Industrial network context",
  id: "company_test_1",
  industry: "Industrials",
  name: "Nordic Industrials",
  website: "https://example.com",
};

const relatedContext = {
  meetings: [],
  notes: [],
};

const relationshipHealth = {
  counts: {
    activeCapabilities: 1,
    activeIntroductions: 1,
    activeNeeds: 1,
    openCommitments: 1,
    openTasks: 1,
    pendingProposals: 1,
  },
  entityId: personProfile.id,
  entityLabel: personProfile.displayName,
  entityType: "PERSON",
  explanation:
    "Needs attention because the linked task is due in the next 7 days.",
  lastInteractionAt: new Date("2026-04-24T10:00:00.000Z"),
  reasonCount: 1,
  reasons: [
    {
      date: new Date("2026-04-25T10:00:00.000Z"),
      explanation: "The linked task is due in the next 7 days.",
      href: "/tasks/task_test_1",
      label: "Upcoming task",
      relatedEntityId: "task_test_1",
      relatedEntityType: "TASK",
      severity: "HIGH",
      type: "UPCOMING_TASK",
    },
  ],
  signal: "NEEDS_ATTENTION",
};

const companyRelationshipHealth = {
  ...relationshipHealth,
  entityId: companyProfile.id,
  entityLabel: companyProfile.name,
  entityType: "COMPANY",
};

const meetingProfile = {
  _count: {
    notes: 1,
    participants: 1,
  },
  archivedAt: null,
  createdAt: new Date("2026-04-24T10:00:00.000Z"),
  endedAt: new Date("2026-04-24T11:00:00.000Z"),
  id: "meeting_test_1",
  location: "Teams",
  notes: [
    {
      body: "Detailed note body for relationship context.",
      createdAt: new Date("2026-04-24T10:05:00.000Z"),
      id: "note_test_1",
      noteType: "MEETING",
      sensitivity: "NORMAL",
      sourceType: "MANUAL",
      summary: "Short note summary.",
      updatedAt: new Date("2026-04-24T10:05:00.000Z"),
    },
  ],
  occurredAt: new Date("2026-04-24T10:00:00.000Z"),
  participants: [
    {
      company: companyProfile,
      companyId: companyProfile.id,
      emailSnapshot: "anna@example.com",
      id: "participant_test_1",
      nameSnapshot: "Anna Keller",
      participantRole: "HOST",
      person: personProfile,
      personId: personProfile.id,
    },
  ],
  primaryCompany: companyProfile,
  primaryCompanyId: companyProfile.id,
  sourceType: "MANUAL",
  summary: "Discussed relationship context.",
  title: "MBSE readiness discussion",
  updatedAt: new Date("2026-04-24T10:00:00.000Z"),
};

const noteProfile = {
  body: "Detailed note body for relationship context.",
  company: companyProfile,
  companyId: companyProfile.id,
  createdAt: new Date("2026-04-24T10:05:00.000Z"),
  id: "note_test_1",
  meeting: meetingProfile,
  meetingId: meetingProfile.id,
  noteType: "MEETING",
  person: personProfile,
  personId: personProfile.id,
  sensitivity: "NORMAL",
  sourceReferences: [],
  sourceType: "MANUAL",
  summary: "Short note summary.",
  targetReferences: [],
  updatedAt: new Date("2026-04-24T10:05:00.000Z"),
};

const voiceNoteProfile = {
  audioDurationSeconds: 24,
  audioMimeType: "audio/webm",
  audioRetentionStatus: "NOT_STORED",
  audioSizeBytes: 4096,
  company: companyProfile,
  companyId: companyProfile.id,
  createdAt: new Date("2026-04-24T13:00:00.000Z"),
  editedTranscriptText: "Reviewed voice transcript.",
  id: "voice_note_test_1",
  language: "en",
  meeting: meetingProfile,
  meetingId: meetingProfile.id,
  note: noteProfile,
  noteId: noteProfile.id,
  person: personProfile,
  personId: personProfile.id,
  rawAudioDeletedAt: new Date("2026-04-24T13:01:00.000Z"),
  status: "TRANSCRIBED",
  title: "Voice follow-up",
  transcriptConfidence: 0.9,
  transcriptText: "Original voice transcript.",
  updatedAt: new Date("2026-04-24T13:05:00.000Z"),
};

const needProfile = {
  company: companyProfile,
  companyId: companyProfile.id,
  confidence: 0.72,
  createdAt: new Date("2026-04-24T11:00:00.000Z"),
  description: "Needs practical examples.",
  id: "need_test_1",
  meeting: meetingProfile,
  meetingId: meetingProfile.id,
  needType: "REQUIREMENT",
  note: noteProfile,
  noteId: noteProfile.id,
  person: personProfile,
  personId: personProfile.id,
  priority: "HIGH",
  sensitivity: "NORMAL",
  status: "OPEN",
  title: "Practical MBSE training examples",
  updatedAt: new Date("2026-04-24T11:00:00.000Z"),
};

const capabilityProfile = {
  capabilityType: "EXPERIENCE",
  company: companyProfile,
  companyId: companyProfile.id,
  confidence: 0.83,
  createdAt: new Date("2026-04-24T11:30:00.000Z"),
  description: "Has delivered SE-CERT preparation.",
  id: "capability_test_1",
  note: noteProfile,
  noteId: noteProfile.id,
  person: personProfile,
  personId: personProfile.id,
  sensitivity: "NORMAL",
  status: "ACTIVE",
  title: "SE-CERT preparation experience",
  updatedAt: new Date("2026-04-24T11:30:00.000Z"),
};

const introductionSuggestionProfile = {
  capability: capabilityProfile,
  capabilityId: capabilityProfile.id,
  confidence: 0.76,
  createdAt: new Date("2026-04-24T11:45:00.000Z"),
  fromCompany: companyProfile,
  fromCompanyId: companyProfile.id,
  fromPerson: personProfile,
  fromPersonId: personProfile.id,
  id: "introduction_test_1",
  need: needProfile,
  needId: needProfile.id,
  rationale: "Introduce Anna to the SE-CERT capability owner.",
  status: "PROPOSED",
  toCompany: null,
  toCompanyId: null,
  toPerson: null,
  toPersonId: null,
  updatedAt: new Date("2026-04-24T11:45:00.000Z"),
};

const taskProfile = {
  commitment: {
    id: "commitment_test_1",
    status: "OPEN",
    title: "Send benchmark outline",
  },
  commitmentId: "commitment_test_1",
  company: companyProfile,
  companyId: companyProfile.id,
  completedAt: null,
  createdAt: new Date("2026-04-24T12:00:00.000Z"),
  description: "Follow up with relationship context.",
  dueAt: new Date("2026-04-25T10:00:00.000Z"),
  id: "task_test_1",
  introductionSuggestion: null,
  introductionSuggestionId: null,
  meeting: meetingProfile,
  meetingId: meetingProfile.id,
  note: noteProfile,
  noteId: noteProfile.id,
  person: personProfile,
  personId: personProfile.id,
  priority: "HIGH",
  reminderAt: null,
  snoozedUntil: null,
  status: "OPEN",
  taskType: "FOLLOW_UP",
  title: "Send follow-up",
  updatedAt: new Date("2026-04-24T12:00:00.000Z"),
  whyNowRationale: "The meeting created a clear next step.",
};

const commitmentProfile = {
  counterpartyCompany: companyProfile,
  counterpartyCompanyId: companyProfile.id,
  counterpartyPerson: personProfile,
  counterpartyPersonId: personProfile.id,
  createdAt: new Date("2026-04-24T12:00:00.000Z"),
  description: "Send the benchmark outline after the meeting.",
  dueAt: new Date("2026-04-25T10:00:00.000Z"),
  dueWindowEnd: null,
  dueWindowStart: null,
  id: "commitment_test_1",
  meeting: meetingProfile,
  meetingId: meetingProfile.id,
  note: noteProfile,
  noteId: noteProfile.id,
  ownerCompany: null,
  ownerCompanyId: null,
  ownerPerson: null,
  ownerPersonId: null,
  ownerType: "ME",
  sensitivity: "NORMAL",
  status: "OPEN",
  tasks: [
    {
      dueAt: taskProfile.dueAt,
      id: taskProfile.id,
      priority: taskProfile.priority,
      status: taskProfile.status,
      taskType: taskProfile.taskType,
      title: taskProfile.title,
    },
  ],
  title: "Send benchmark outline",
  updatedAt: new Date("2026-04-24T12:00:00.000Z"),
};

const proposalItem = {
  actionType: "UPDATE",
  confidence: 0.81,
  explanation: "Proposed update explanation.",
  id: "proposal_item_test_1",
  proposedPatch: {
    title: "Proposed title",
  },
  status: "PENDING_REVIEW",
  targetEntityId: "task_test_1",
  targetEntityType: "TASK",
};

const proposalProfile = {
  _count: {
    items: 1,
  },
  confidence: 0.82,
  createdAt: new Date("2026-04-24T12:00:00.000Z"),
  explanation: "Review only proposal explanation.",
  id: "proposal_test_1",
  itemTargetContexts: {
    proposal_item_test_1: {
      available: true,
      entityId: "task_test_1",
      entityType: "TASK",
      href: "/tasks/task_test_1",
      label: "Send follow-up",
    },
  },
  items: [proposalItem],
  proposalType: "NOTE_EXTRACTION",
  sourceMeeting: meetingProfile,
  sourceMeetingId: meetingProfile.id,
  sourceNote: noteProfile,
  sourceNoteId: noteProfile.id,
  sourceReferences: [],
  sourceVoiceNote: null,
  sourceVoiceNoteId: null,
  status: "PENDING_REVIEW",
  summary: "Proposal summary.",
  targetContext: {
    available: true,
    entityId: "task_test_1",
    entityType: "TASK",
    href: "/tasks/task_test_1",
    label: "Send follow-up",
  },
  targetEntityId: "task_test_1",
  targetEntityType: "TASK",
  title: "Proposed follow-up update",
  updatedAt: new Date("2026-04-24T12:00:00.000Z"),
};

const meetingPrepBrief = {
  companies: [
    {
      health: companyRelationshipHealth,
      id: companyProfile.id,
      isPrimary: true,
      name: companyProfile.name,
      recentNotes: [
        {
          createdAt: noteProfile.createdAt,
          href: `/notes/${noteProfile.id}`,
          id: noteProfile.id,
          noteType: noteProfile.noteType,
          preview: noteProfile.summary,
          sensitivity: noteProfile.sensitivity,
          sourceType: noteProfile.sourceType,
          updatedAt: noteProfile.updatedAt,
        },
      ],
    },
  ],
  meeting: {
    createdAt: meetingProfile.createdAt,
    endedAt: meetingProfile.endedAt,
    id: meetingProfile.id,
    location: meetingProfile.location,
    occurredAt: meetingProfile.occurredAt,
    primaryCompany: {
      entityId: companyProfile.id,
      entityType: "COMPANY",
      href: `/people/companies/${companyProfile.id}`,
      label: companyProfile.name,
    },
    sourceType: meetingProfile.sourceType,
    summary: meetingProfile.summary,
    title: meetingProfile.title,
    updatedAt: meetingProfile.updatedAt,
  },
  participants: [
    {
      company: {
        entityId: companyProfile.id,
        entityType: "COMPANY",
        href: `/people/companies/${companyProfile.id}`,
        label: companyProfile.name,
      },
      emailSnapshot: "anna@example.com",
      health: relationshipHealth,
      id: "participant_test_1",
      isKnownPerson: true,
      name: personProfile.displayName,
      participantRole: "HOST",
      person: {
        entityId: personProfile.id,
        entityType: "PERSON",
        href: `/people/${personProfile.id}`,
        label: personProfile.displayName,
      },
      recentNotes: [
        {
          createdAt: noteProfile.createdAt,
          href: `/notes/${noteProfile.id}`,
          id: noteProfile.id,
          noteType: noteProfile.noteType,
          preview: noteProfile.summary,
          sensitivity: noteProfile.sensitivity,
          sourceType: noteProfile.sourceType,
          updatedAt: noteProfile.updatedAt,
        },
      ],
    },
    {
      company: null,
      emailSnapshot: "snapshot@example.com",
      health: null,
      id: "participant_snapshot_1",
      isKnownPerson: false,
      name: "Snapshot Guest",
      participantRole: "ATTENDEE",
      person: null,
      recentNotes: [],
    },
  ],
  records: {
    capabilities: [
      {
        capabilityType: capabilityProfile.capabilityType,
        confidence: capabilityProfile.confidence,
        href: `/opportunities/capabilities/${capabilityProfile.id}`,
        id: capabilityProfile.id,
        sensitivity: capabilityProfile.sensitivity,
        status: capabilityProfile.status,
        title: capabilityProfile.title,
      },
    ],
    commitments: [
      {
        dueAt: commitmentProfile.dueAt,
        dueWindowEnd: commitmentProfile.dueWindowEnd,
        dueWindowStart: commitmentProfile.dueWindowStart,
        href: `/commitments/${commitmentProfile.id}`,
        id: commitmentProfile.id,
        ownerType: commitmentProfile.ownerType,
        sensitivity: commitmentProfile.sensitivity,
        status: commitmentProfile.status,
        title: commitmentProfile.title,
      },
    ],
    introductions: [
      {
        confidence: introductionSuggestionProfile.confidence,
        href: `/opportunities/introductions/${introductionSuggestionProfile.id}`,
        id: introductionSuggestionProfile.id,
        rationalePreview: introductionSuggestionProfile.rationale,
        status: introductionSuggestionProfile.status,
      },
    ],
    needs: [
      {
        confidence: needProfile.confidence,
        href: `/opportunities/needs/${needProfile.id}`,
        id: needProfile.id,
        needType: needProfile.needType,
        priority: needProfile.priority,
        sensitivity: needProfile.sensitivity,
        status: needProfile.status,
        title: needProfile.title,
      },
    ],
    notes: [
      {
        createdAt: noteProfile.createdAt,
        href: `/notes/${noteProfile.id}`,
        id: noteProfile.id,
        noteType: noteProfile.noteType,
        preview: noteProfile.summary,
        sensitivity: noteProfile.sensitivity,
        sourceType: noteProfile.sourceType,
        updatedAt: noteProfile.updatedAt,
      },
    ],
    proposals: [
      {
        confidence: proposalProfile.confidence,
        href: `/proposals/${proposalProfile.id}`,
        id: proposalProfile.id,
        proposalType: proposalProfile.proposalType,
        reviewOnly: true,
        status: proposalProfile.status,
        title: proposalProfile.title,
      },
    ],
    recentMeetings: [
      {
        href: `/meetings/${meetingProfile.id}`,
        id: "meeting_recent_1",
        occurredAt: new Date("2026-04-20T10:00:00.000Z"),
        primaryCompanyName: companyProfile.name,
        title: "Earlier relationship check-in",
      },
    ],
    sourceReferences: [
      {
        confidence: 0.9,
        createdAt: new Date("2026-04-24T12:30:00.000Z"),
        id: "source_reference_test_1",
        label: "Meeting note provenance",
        reason: null,
        source: {
          entityId: noteProfile.id,
          entityType: "NOTE",
          href: `/notes/${noteProfile.id}`,
          label: "Note",
        },
        target: {
          entityId: meetingProfile.id,
          entityType: "MEETING",
          href: `/meetings/${meetingProfile.id}`,
          label: "Meeting",
        },
      },
    ],
    tasks: [
      {
        dueAt: taskProfile.dueAt,
        href: `/tasks/${taskProfile.id}`,
        id: taskProfile.id,
        priority: taskProfile.priority,
        status: taskProfile.status,
        taskType: taskProfile.taskType,
        title: taskProfile.title,
      },
    ],
  },
};

const taskBoard = {
  dueToday: [taskProfile],
  openWithoutDue: [],
  overdue: [],
  recentlyCompleted: [],
  upcoming: [],
};

const commitmentBoard = {
  dueToday: [commitmentProfile],
  openWithoutDue: [],
  overdue: [],
  recentlyFulfilled: [],
  upcoming: [],
  waiting: [],
};

const taskFormOptions = {
  commitments: [
    {
      id: commitmentProfile.id,
      title: commitmentProfile.title,
    },
  ],
  companies: [companyProfile],
  introductionSuggestions: [introductionSuggestionProfile],
  meetings: [meetingProfile],
  notes: [noteProfile],
  people: [personProfile],
};

const commitmentFormOptions = {
  companies: [companyProfile],
  meetings: [meetingProfile],
  notes: [noteProfile],
  people: [personProfile],
};

const opportunityFormOptions = {
  capabilities: [
    {
      id: capabilityProfile.id,
      title: capabilityProfile.title,
    },
  ],
  companies: [companyProfile],
  meetings: [meetingProfile],
  needs: [
    {
      id: needProfile.id,
      title: needProfile.title,
    },
  ],
  notes: [noteProfile],
  people: [personProfile],
};

const affiliationProfile = {
  affiliationTitle: "Advisor",
  company: companyProfile,
  companyId: companyProfile.id,
  department: "Transformation",
  endsAt: null,
  id: "affiliation_test_1",
  isPrimary: true,
  person: personProfile,
  personId: personProfile.id,
  startsAt: null,
};

type AsyncPage = () => Promise<ReactElement>;

const routes: Array<[string, () => Promise<{ default: AsyncPage }>]> = [
  ["Today", () => import("@/app/(app)/today/page")],
  ["Capture", () => import("@/app/(app)/capture/page")],
  ["People", () => import("@/app/(app)/people/page")],
  ["Opportunities", () => import("@/app/(app)/opportunities/page")],
  ["Search", () => import("@/app/(app)/search/page")],
];

async function renderRoute(importPage: () => Promise<{ default: AsyncPage }>) {
  const Page = (await importPage()).default;

  render(await Page());
}

describe("protected app routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUserContext.mockResolvedValue(tenantContext);
    mocks.getAppShellSummary.mockResolvedValue(appSummary);
    mocks.getTenantCompany.mockResolvedValue(companyProfile);
    mocks.getTenantMeeting.mockResolvedValue(meetingProfile);
    mocks.getTenantMeetingPrepBrief.mockResolvedValue(meetingPrepBrief);
    mocks.getTenantMeetingProfile.mockResolvedValue(meetingProfile);
    mocks.getTenantNote.mockResolvedValue(noteProfile);
    mocks.getTenantNoteProfile.mockResolvedValue(noteProfile);
    mocks.getTenantVoiceNoteProfile.mockResolvedValue(voiceNoteProfile);
    mocks.getTenantNeedProfile.mockResolvedValue(needProfile);
    mocks.getTenantCapabilityProfile.mockResolvedValue(capabilityProfile);
    mocks.getTenantOpportunityHub.mockResolvedValue({
      counts: {
        activeCapabilities: 1,
        activeIntroductions: 1,
        openNeeds: 1,
      },
      latestCapabilities: [capabilityProfile],
      latestIntroductions: [introductionSuggestionProfile],
      latestNeeds: [needProfile],
    });
    mocks.getTenantOpportunityFormOptions.mockResolvedValue(
      opportunityFormOptions,
    );
    mocks.listTenantSourceReferencesForTarget.mockResolvedValue([]);
    mocks.getTenantTaskBoard.mockResolvedValue(taskBoard);
    mocks.getTenantTaskFormOptions.mockResolvedValue(taskFormOptions);
    mocks.getTenantTaskProfile.mockResolvedValue(taskProfile);
    mocks.getTenantIntroductionSuggestionProfile.mockResolvedValue(
      introductionSuggestionProfile,
    );
    mocks.getTenantPerson.mockResolvedValue(personProfile);
    mocks.getTenantPersonProfile.mockResolvedValue(personProfile);
    mocks.getTenantCompanyProfile.mockResolvedValue(companyProfile);
    mocks.getTenantCompanyAffiliationForPerson.mockResolvedValue(
      affiliationProfile,
    );
    mocks.getTenantCommitment.mockResolvedValue(commitmentProfile);
    mocks.getTenantCommitmentBoard.mockResolvedValue(commitmentBoard);
    mocks.getTenantCommitmentFormOptions.mockResolvedValue(
      commitmentFormOptions,
    );
    mocks.getTenantCommitmentProfile.mockResolvedValue(commitmentProfile);
    mocks.getTenantAIProposalProfile.mockResolvedValue(proposalProfile);
    mocks.getTenantAIProposalReviewSummary.mockResolvedValue({
      itemsNeedingClarification: 0,
      pendingProposals: 1,
    });
    mocks.getTenantRelationshipAttentionBoard.mockResolvedValue({
      items: [relationshipHealth],
      totals: {
        companies: 1,
        people: 1,
        shown: 1,
      },
    });
    mocks.getTenantPersonRelationshipHealth.mockResolvedValue(
      relationshipHealth,
    );
    mocks.getTenantCompanyRelationshipHealth.mockResolvedValue(
      companyRelationshipHealth,
    );
    mocks.getTenantPersonRelatedContext.mockResolvedValue(relatedContext);
    mocks.getTenantCompanyRelatedContext.mockResolvedValue(relatedContext);
    mocks.listTenantPeople.mockResolvedValue([personProfile]);
    mocks.listTenantCompanies.mockResolvedValue([companyProfile]);
    mocks.listTenantMeetings.mockResolvedValue([meetingProfile]);
    mocks.listTenantNotes.mockResolvedValue([noteProfile]);
    mocks.listTenantNeedsWithContext.mockResolvedValue([needProfile]);
    mocks.listTenantCapabilitiesWithContext.mockResolvedValue([
      capabilityProfile,
    ]);
    mocks.listTenantIntroductionSuggestionsWithContext.mockResolvedValue([
      introductionSuggestionProfile,
    ]);
    mocks.listTenantAIProposals.mockResolvedValue([proposalProfile]);
    mocks.listTenantPeopleWithProfiles.mockResolvedValue([
      {
        ...personProfile,
        companyAffiliations: [],
      },
    ]);
    mocks.listTenantCompaniesWithProfiles.mockResolvedValue([
      {
        ...companyProfile,
        companyAffiliations: [],
      },
    ]);
  });

  it.each(routes)("renders the %s route", async (heading, importPage) => {
    await renderRoute(importPage);

    expect(
      screen.getByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
  });

  it("links Capture to voice recording", async () => {
    const Page = (await import("@/app/(app)/capture/page")).default;

    render(await Page());

    expect(
      screen.getByRole("link", { name: "Record voice note" }),
    ).toHaveAttribute("href", "/capture/voice");
  });

  it("links Settings to integrations readiness", async () => {
    const Page = (await import("@/app/(app)/settings/page")).default;

    render(await Page());

    expect(
      screen.getByRole("link", { name: "Open integrations" }),
    ).toHaveAttribute("href", "/settings/integrations");
  });

  it("renders the integrations settings route", async () => {
    const Page = (await import("@/app/(app)/settings/integrations/page"))
      .default;

    render(await Page());

    expect(
      screen.getByRole("heading", { level: 1, name: "Integrations" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(
      screen.getByText("Readiness only. No Microsoft data is synced yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connection coming later" }),
    ).toBeDisabled();
  });

  it("redirects the protected app shell when no session context exists", async () => {
    mocks.getCurrentUserContext.mockResolvedValueOnce(null);
    const Layout = (await import("@/app/(app)/layout")).default;

    await expect(
      Layout({ children: <div>Protected content</div> }),
    ).rejects.toThrow("redirect:/sign-in");
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
  });

  it.each([
    ["Create person", () => import("@/app/(app)/people/new/page")],
    [
      "Companies",
      () => import("@/app/(app)/people/companies/page"),
    ],
    [
      "Create company",
      () => import("@/app/(app)/people/companies/new/page"),
    ],
  ])("renders the %s people workflow route", async (heading, importPage) => {
    await renderRoute(importPage);

    expect(
      screen.getByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
  });

  it.each([
    ["Meetings", () => import("@/app/(app)/meetings/page")],
    ["Create meeting", () => import("@/app/(app)/meetings/new/page")],
    ["Create note", () => import("@/app/(app)/notes/new/page")],
    ["Paste meeting notes", () => import("@/app/(app)/capture/meeting/page")],
    ["Tasks", () => import("@/app/(app)/tasks/page")],
    ["Commitments", () => import("@/app/(app)/commitments/page")],
    ["Proposals", () => import("@/app/(app)/proposals/page")],
    ["Needs", () => import("@/app/(app)/opportunities/needs/page")],
    [
      "Capabilities",
      () => import("@/app/(app)/opportunities/capabilities/page"),
    ],
    [
      "Introductions",
      () => import("@/app/(app)/opportunities/introductions/page"),
    ],
  ])("renders the %s protected route", async (heading, importPage) => {
    await renderRoute(importPage);

    expect(
      screen.getByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
  });

  it("renders the task create route", async () => {
    const Page = (await import("@/app/(app)/tasks/new/page")).default;

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Create task" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Task form")).toBeInTheDocument();
  });

  it("renders the commitment create route", async () => {
    const Page = (await import("@/app/(app)/commitments/new/page")).default;

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Create commitment" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Commitment form")).toBeInTheDocument();
  });

  it("renders the need create route", async () => {
    const Page = (await import("@/app/(app)/opportunities/needs/new/page"))
      .default;

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Create need" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Need form")).toBeInTheDocument();
  });

  it("renders the capability create route", async () => {
    const Page = (
      await import("@/app/(app)/opportunities/capabilities/new/page")
    ).default;

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Create capability" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Capability form")).toBeInTheDocument();
  });

  it("renders the introduction suggestion create route", async () => {
    const Page = (
      await import("@/app/(app)/opportunities/introductions/new/page")
    ).default;

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Create introduction" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Introduction suggestion form"),
    ).toBeInTheDocument();
  });

  it("renders the voice capture route", async () => {
    const Page = (await import("@/app/(app)/capture/voice/page")).default;

    render(
      await Page({
        searchParams: Promise.resolve({
          companyId: companyProfile.id,
          meetingId: meetingProfile.id,
          noteId: noteProfile.id,
          personId: personProfile.id,
        }),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Record voice note" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Voice recorder")).toBeInTheDocument();
  });

  it("renders the meeting detail route", async () => {
    const Page = (await import("@/app/(app)/meetings/[meetingId]/page"))
      .default;

    render(
      await Page({ params: Promise.resolve({ meetingId: "meeting_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "MBSE readiness discussion",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("View prep brief")).toBeInTheDocument();
  });

  it("renders the meeting prep brief route", async () => {
    const Page = (
      await import("@/app/(app)/meetings/[meetingId]/prep/page")
    ).default;

    render(
      await Page({ params: Promise.resolve({ meetingId: "meeting_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Prepare: MBSE readiness discussion",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No AI generation, sync, or record mutation."),
    ).toBeInTheDocument();
  });

  it("renders the meeting edit route", async () => {
    const Page = (await import("@/app/(app)/meetings/[meetingId]/edit/page"))
      .default;

    render(
      await Page({ params: Promise.resolve({ meetingId: "meeting_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "MBSE readiness discussion",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Meeting form")).toBeInTheDocument();
  });

  it("renders the meeting participant create route", async () => {
    const Page = (
      await import("@/app/(app)/meetings/[meetingId]/participants/new/page")
    ).default;

    render(
      await Page({ params: Promise.resolve({ meetingId: "meeting_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "MBSE readiness discussion",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Meeting participant form"),
    ).toBeInTheDocument();
  });

  it("renders the meeting note create route", async () => {
    const Page = (
      await import("@/app/(app)/meetings/[meetingId]/notes/new/page")
    ).default;

    render(
      await Page({ params: Promise.resolve({ meetingId: "meeting_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "MBSE readiness discussion",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Note form")).toBeInTheDocument();
  });

  it("renders the note detail route", async () => {
    const Page = (await import("@/app/(app)/notes/[noteId]/page")).default;

    render(await Page({ params: Promise.resolve({ noteId: "note_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Meeting note" }),
    ).toBeInTheDocument();
  });

  it("renders the note edit route", async () => {
    const Page = (await import("@/app/(app)/notes/[noteId]/edit/page"))
      .default;

    render(await Page({ params: Promise.resolve({ noteId: "note_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Meeting note" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Note form")).toBeInTheDocument();
  });

  it("renders the voice note detail route", async () => {
    const Page = (await import("@/app/(app)/voice-notes/[voiceNoteId]/page"))
      .default;

    render(
      await Page({
        params: Promise.resolve({ voiceNoteId: "voice_note_test_1" }),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Voice follow-up" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Original voice transcript.")).toBeInTheDocument();
  });

  it("renders the voice note edit route", async () => {
    const Page = (
      await import("@/app/(app)/voice-notes/[voiceNoteId]/edit/page")
    ).default;

    render(
      await Page({
        params: Promise.resolve({ voiceNoteId: "voice_note_test_1" }),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Voice follow-up" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Voice note form")).toBeInTheDocument();
  });

  it("renders the task detail route", async () => {
    const Page = (await import("@/app/(app)/tasks/[taskId]/page")).default;

    render(await Page({ params: Promise.resolve({ taskId: "task_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Send follow-up" }),
    ).toBeInTheDocument();
  });

  it("renders the task edit route", async () => {
    const Page = (await import("@/app/(app)/tasks/[taskId]/edit/page"))
      .default;

    render(await Page({ params: Promise.resolve({ taskId: "task_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Send follow-up" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Task form")).toBeInTheDocument();
  });

  it("renders the commitment detail route", async () => {
    const Page = (
      await import("@/app/(app)/commitments/[commitmentId]/page")
    ).default;

    render(
      await Page({
        params: Promise.resolve({ commitmentId: "commitment_test_1" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Send benchmark outline",
      }),
    ).toBeInTheDocument();
  });

  it("renders the commitment edit route", async () => {
    const Page = (
      await import("@/app/(app)/commitments/[commitmentId]/edit/page")
    ).default;

    render(
      await Page({
        params: Promise.resolve({ commitmentId: "commitment_test_1" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Send benchmark outline",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Commitment form")).toBeInTheDocument();
  });

  it("renders the proposal detail route", async () => {
    const Page = (
      await import("@/app/(app)/proposals/[proposalId]/page")
    ).default;

    render(
      await Page({
        params: Promise.resolve({ proposalId: "proposal_test_1" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Proposed follow-up update",
      }),
    ).toBeInTheDocument();
  });

  it("renders the need detail and edit routes", async () => {
    const DetailPage = (
      await import("@/app/(app)/opportunities/needs/[needId]/page")
    ).default;
    const EditPage = (
      await import("@/app/(app)/opportunities/needs/[needId]/edit/page")
    ).default;

    render(
      await DetailPage({
        params: Promise.resolve({ needId: "need_test_1" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Practical MBSE training examples",
      }),
    ).toBeInTheDocument();

    render(
      await EditPage({
        params: Promise.resolve({ needId: "need_test_1" }),
      }),
    );

    expect(screen.getByLabelText("Need form")).toBeInTheDocument();
  });

  it("renders the capability detail and edit routes", async () => {
    const DetailPage = (
      await import(
        "@/app/(app)/opportunities/capabilities/[capabilityId]/page"
      )
    ).default;
    const EditPage = (
      await import(
        "@/app/(app)/opportunities/capabilities/[capabilityId]/edit/page"
      )
    ).default;

    render(
      await DetailPage({
        params: Promise.resolve({ capabilityId: "capability_test_1" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "SE-CERT preparation experience",
      }),
    ).toBeInTheDocument();

    render(
      await EditPage({
        params: Promise.resolve({ capabilityId: "capability_test_1" }),
      }),
    );

    expect(screen.getByLabelText("Capability form")).toBeInTheDocument();
  });

  it("renders the introduction suggestion detail and edit routes", async () => {
    const DetailPage = (
      await import(
        "@/app/(app)/opportunities/introductions/[introductionSuggestionId]/page"
      )
    ).default;
    const EditPage = (
      await import(
        "@/app/(app)/opportunities/introductions/[introductionSuggestionId]/edit/page"
      )
    ).default;

    render(
      await DetailPage({
        params: Promise.resolve({
          introductionSuggestionId: "introduction_test_1",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Practical MBSE training examples <> SE-CERT preparation experience",
      }),
    ).toBeInTheDocument();

    render(
      await EditPage({
        params: Promise.resolve({
          introductionSuggestionId: "introduction_test_1",
        }),
      }),
    );

    expect(
      screen.getByLabelText("Introduction suggestion form"),
    ).toBeInTheDocument();
  });

  it("renders the person detail route", async () => {
    const Page = (await import("@/app/(app)/people/[personId]/page")).default;

    render(await Page({ params: Promise.resolve({ personId: "person_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Anna Keller" }),
    ).toBeInTheDocument();
  });

  it("renders the person edit route", async () => {
    const Page = (await import("@/app/(app)/people/[personId]/edit/page"))
      .default;

    render(await Page({ params: Promise.resolve({ personId: "person_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Anna Keller" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Person form")).toBeInTheDocument();
  });

  it("renders the company detail route", async () => {
    const Page = (await import("@/app/(app)/people/companies/[companyId]/page"))
      .default;

    render(
      await Page({ params: Promise.resolve({ companyId: "company_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Nordic Industrials" }),
    ).toBeInTheDocument();
  });

  it("renders the company edit route", async () => {
    const Page = (
      await import("@/app/(app)/people/companies/[companyId]/edit/page")
    ).default;

    render(
      await Page({ params: Promise.resolve({ companyId: "company_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Nordic Industrials" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Company form")).toBeInTheDocument();
  });

  it("renders the person affiliation create route", async () => {
    const Page = (await import("@/app/(app)/people/[personId]/affiliations/new/page"))
      .default;

    render(await Page({ params: Promise.resolve({ personId: "person_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Anna Keller" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Affiliation form")).toBeInTheDocument();
  });

  it("renders the company affiliation create route", async () => {
    const Page = (
      await import(
        "@/app/(app)/people/companies/[companyId]/affiliations/new/page"
      )
    ).default;

    render(
      await Page({ params: Promise.resolve({ companyId: "company_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Nordic Industrials" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Affiliation form")).toBeInTheDocument();
  });

  it("renders the affiliation edit route", async () => {
    const Page = (
      await import(
        "@/app/(app)/people/[personId]/affiliations/[affiliationId]/edit/page"
      )
    ).default;

    render(
      await Page({
        params: Promise.resolve({
          affiliationId: "affiliation_test_1",
          personId: "person_test_1",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Nordic Industrials" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Affiliation form")).toBeInTheDocument();
  });
});
