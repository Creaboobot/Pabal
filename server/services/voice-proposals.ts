import {
  type AIProposalActionType,
  type AIProposalItemStatus,
  Prisma,
  type SourceEntityType,
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { getTranscriptStructuringProvider } from "@/server/providers/transcript-structuring";
import {
  type TranscriptStructuringEntityCandidate,
  type TranscriptStructuringInput,
  type TranscriptStructuringItem,
  type TranscriptStructuringProvider,
  TranscriptStructuringProviderError,
  parseTranscriptStructuringResult,
} from "@/server/providers/transcript-structuring/types";
import { createAIProposalItem } from "@/server/repositories/ai-proposal-items";
import { createAIProposal } from "@/server/repositories/ai-proposals";
import { findVoiceNoteById } from "@/server/repositories/voice-notes";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  assertOptionalPolymorphicRelationshipBelongsToTenant,
  relationshipEntityExistsInTenant,
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";
import { MAX_VOICE_TRANSCRIPT_LENGTH } from "@/server/services/voice-transcription";

const ACTIVE_PROPOSAL_STATUSES = [
  "PENDING_REVIEW",
  "IN_REVIEW",
  "APPROVED",
  "PARTIALLY_APPROVED",
  "REJECTED",
] as const;

type CandidateDirectory = {
  candidates: TranscriptStructuringEntityCandidate[];
  companies: Array<{
    domains: string[];
    id: string;
    labels: string[];
    name: string;
  }>;
  people: Array<{
    emails: string[];
    id: string;
    labels: string[];
    name: string;
  }>;
};

type ResolvedStructuredItem = {
  actionType: AIProposalActionType;
  confidence: number | null;
  explanation: string;
  proposedPatch: Prisma.InputJsonValue;
  status: AIProposalItemStatus;
  targetEntityId: string | null;
  targetEntityType: SourceEntityType | null;
};

export class VoiceProposalStructuringError extends Error {
  readonly safeMessage: string;

  constructor(message: string) {
    super(message);
    this.name = "VoiceProposalStructuringError";
    this.safeMessage = message;
  }
}

function normalizeMatchText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeDomain(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const raw = value.trim().toLowerCase();
  const valueWithProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(valueWithProtocol).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^www\./, "").split("/")[0] ?? raw;
  }
}

function actionTypeForItem(item: TranscriptStructuringItem): AIProposalActionType {
  switch (item.proposedPatch.kind) {
    case "CREATE_NOTE":
    case "CREATE_TASK":
    case "CREATE_COMMITMENT":
    case "CREATE_NEED":
    case "CREATE_CAPABILITY":
    case "CREATE_INTRODUCTION_SUGGESTION":
      return "CREATE";
    case "UPDATE_PERSON":
    case "UPDATE_COMPANY":
      return "UPDATE";
    case "ADD_SOURCE_REFERENCE":
      return "LINK";
    case "NO_OP":
      return "NO_OP";
  }
}

function sourceContextForVoiceNote(input: {
  company: { id: string; name: string } | null;
  id: string;
  meeting: { id: string; title: string } | null;
  note: { id: string; noteType: string; summary: string | null } | null;
  person: { displayName: string; id: string } | null;
  title: string | null;
}) {
  return {
    companyId: input.company?.id ?? null,
    companyName: input.company?.name ?? null,
    meetingId: input.meeting?.id ?? null,
    meetingTitle: input.meeting?.title ?? null,
    noteId: input.note?.id ?? null,
    noteLabel: input.note?.summary ?? input.note?.noteType ?? null,
    personId: input.person?.id ?? null,
    personName: input.person?.displayName ?? null,
    voiceNoteId: input.id,
    voiceNoteTitle: input.title,
  };
}

function candidateKey(candidate: TranscriptStructuringEntityCandidate) {
  return `${candidate.entityType}:${candidate.entityId}`;
}

function addCandidate(
  candidates: Map<string, TranscriptStructuringEntityCandidate>,
  candidate: TranscriptStructuringEntityCandidate,
) {
  candidates.set(candidateKey(candidate), candidate);
}

async function loadCandidateDirectory(input: {
  tenantId: string;
  voiceNote: {
    companyId: string | null;
    meetingId: string | null;
    personId: string | null;
  };
}): Promise<CandidateDirectory> {
  const [people, companies, meetingParticipants] = await Promise.all([
    prisma.person.findMany({
      orderBy: { displayName: "asc" },
      select: { displayName: true, email: true, id: true },
      take: 200,
      where: {
        archivedAt: null,
        tenantId: input.tenantId,
      },
    }),
    prisma.company.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, normalizedName: true, website: true },
      take: 200,
      where: {
        archivedAt: null,
        tenantId: input.tenantId,
      },
    }),
    input.voiceNote.meetingId
      ? prisma.meetingParticipant.findMany({
          include: {
            company: { select: { id: true, name: true, website: true } },
            person: { select: { displayName: true, email: true, id: true } },
          },
          where: {
            meetingId: input.voiceNote.meetingId,
            tenantId: input.tenantId,
          },
        })
      : Promise.resolve([]),
  ]);
  const candidateMap = new Map<string, TranscriptStructuringEntityCandidate>();

  for (const person of people) {
    addCandidate(candidateMap, {
      email: person.email,
      entityId: person.id,
      entityType: "PERSON",
      label: person.displayName,
      source:
        person.id === input.voiceNote.personId
          ? "voice_note_context"
          : "tenant_directory",
    });
  }

  for (const company of companies) {
    addCandidate(candidateMap, {
      aliases: company.normalizedName ? [company.normalizedName] : [],
      domain: normalizeDomain(company.website),
      entityId: company.id,
      entityType: "COMPANY",
      label: company.name,
      source:
        company.id === input.voiceNote.companyId
          ? "voice_note_context"
          : "tenant_directory",
    });
  }

  for (const participant of meetingParticipants) {
    if (participant.person) {
      addCandidate(candidateMap, {
        email: participant.person.email,
        entityId: participant.person.id,
        entityType: "PERSON",
        label: participant.person.displayName,
        source: "meeting_participant",
      });
    }

    if (participant.company) {
      addCandidate(candidateMap, {
        domain: normalizeDomain(participant.company.website),
        entityId: participant.company.id,
        entityType: "COMPANY",
        label: participant.company.name,
        source: "meeting_participant",
      });
    }
  }

  const candidates = [...candidateMap.values()];

  return {
    candidates,
    companies: candidates
      .filter((candidate) => candidate.entityType === "COMPANY")
      .map((company) => ({
        domains: [normalizeDomain(company.domain)].filter(Boolean),
        id: company.entityId,
        labels: [company.label, ...(company.aliases ?? [])]
          .map(normalizeMatchText)
          .filter(Boolean),
        name: company.label,
      })),
    people: candidates
      .filter((candidate) => candidate.entityType === "PERSON")
      .map((person) => ({
        emails: [normalizeEmail(person.email)].filter(Boolean),
        id: person.entityId,
        labels: [normalizeMatchText(person.label)].filter(Boolean),
        name: person.label,
      })),
  };
}

function resolvePersonByLookup(
  directory: CandidateDirectory,
  item: TranscriptStructuringItem,
) {
  const email = normalizeEmail(item.targetLookupEmail);

  if (email) {
    const matches = directory.people.filter((person) =>
      person.emails.includes(email),
    );

    if (matches.length === 1) {
      return matches[0]?.id ?? null;
    }

    return null;
  }

  const name = normalizeMatchText(item.targetLookupName);

  if (!name) {
    return null;
  }

  const matches = directory.people.filter((person) =>
    person.labels.includes(name),
  );

  return matches.length === 1 ? matches[0]?.id ?? null : null;
}

function resolveCompanyByLookup(
  directory: CandidateDirectory,
  item: TranscriptStructuringItem,
) {
  const domain = normalizeDomain(item.targetLookupDomain);

  if (domain) {
    const matches = directory.companies.filter((company) =>
      company.domains.includes(domain),
    );

    if (matches.length === 1) {
      return matches[0]?.id ?? null;
    }

    return null;
  }

  const name = normalizeMatchText(item.targetLookupName);

  if (!name) {
    return null;
  }

  const matches = directory.companies.filter((company) =>
    company.labels.includes(name),
  );

  return matches.length === 1 ? matches[0]?.id ?? null : null;
}

async function resolveItemTarget(input: {
  directory: CandidateDirectory;
  item: TranscriptStructuringItem;
  tenantId: string;
}): Promise<{
  targetEntityId: string | null;
  targetEntityType: SourceEntityType | null;
  unresolved: boolean;
}> {
  if (input.item.targetEntityType && input.item.targetEntityId) {
    const exists = await relationshipEntityExistsInTenant({
      tenantId: input.tenantId,
      entityId: input.item.targetEntityId,
      entityType: input.item.targetEntityType,
    });

    if (exists) {
      return {
        targetEntityId: input.item.targetEntityId,
        targetEntityType: input.item.targetEntityType as SourceEntityType,
        unresolved: false,
      };
    }

    return {
      targetEntityId: null,
      targetEntityType: null,
      unresolved: true,
    };
  }

  if (input.item.targetEntityType === "PERSON") {
    const resolvedId = resolvePersonByLookup(input.directory, input.item);

    return {
      targetEntityId: resolvedId,
      targetEntityType: resolvedId ? "PERSON" : null,
      unresolved: Boolean(
        !resolvedId &&
          (input.item.targetLookupEmail || input.item.targetLookupName),
      ),
    };
  }

  if (input.item.targetEntityType === "COMPANY") {
    const resolvedId = resolveCompanyByLookup(input.directory, input.item);

    return {
      targetEntityId: resolvedId,
      targetEntityType: resolvedId ? "COMPANY" : null,
      unresolved: Boolean(
        !resolvedId &&
          (input.item.targetLookupDomain || input.item.targetLookupName),
      ),
    };
  }

  return {
    targetEntityId: null,
    targetEntityType: null,
    unresolved: false,
  };
}

function patchForItem(input: {
  item: TranscriptStructuringItem;
  sourceVoiceNoteId: string;
  unresolved: boolean;
}) {
  return {
    ...input.item.proposedPatch,
    reviewOnly: true,
    sourceVoiceNoteId: input.sourceVoiceNoteId,
    targetLookup: {
      domain: input.item.targetLookupDomain,
      email: input.item.targetLookupEmail,
      name: input.item.targetLookupName,
    },
    uncertaintyFlags: input.unresolved
      ? [...input.item.uncertaintyFlags, "target_unresolved"]
      : input.item.uncertaintyFlags,
  } satisfies Prisma.InputJsonObject;
}

async function normalizeStructuredItems(input: {
  directory: CandidateDirectory;
  items: TranscriptStructuringItem[];
  tenantId: string;
  voiceNoteId: string;
}): Promise<ResolvedStructuredItem[]> {
  return Promise.all(
    input.items.map(async (item) => {
      const target = await resolveItemTarget({
        directory: input.directory,
        item,
        tenantId: input.tenantId,
      });
      const needsClarification = item.needsClarification || target.unresolved;

      return {
        actionType: actionTypeForItem(item),
        confidence: item.confidence,
        explanation: item.explanation,
        proposedPatch: patchForItem({
          item,
          sourceVoiceNoteId: input.voiceNoteId,
          unresolved: target.unresolved,
        }),
        status: needsClarification
          ? "NEEDS_CLARIFICATION"
          : "PENDING_REVIEW",
        targetEntityId: target.targetEntityId,
        targetEntityType: target.targetEntityType,
      };
    }),
  );
}

function transcriptForVoiceNote(input: {
  editedTranscriptText: string | null;
  transcriptText: string | null;
}) {
  const transcript =
    input.editedTranscriptText?.trim() || input.transcriptText?.trim() || "";

  if (!transcript) {
    throw new VoiceProposalStructuringError(
      "This voice note does not have a transcript to structure.",
    );
  }

  if (transcript.length > MAX_VOICE_TRANSCRIPT_LENGTH) {
    throw new VoiceProposalStructuringError(
      "This transcript is longer than the 80,000 character limit.",
    );
  }

  return transcript;
}

function creationAuditMetadata(input: {
  itemCount: number;
  proposalId: string;
  providerName: string;
  resolvedTargetCount: number;
  transcriptLength: number;
  unresolvedTargetCount: number;
  voiceNoteId: string;
}) {
  return {
    itemCount: input.itemCount,
    proposalId: input.proposalId,
    providerName: input.providerName,
    resolvedTargetCount: input.resolvedTargetCount,
    transcriptLength: input.transcriptLength,
    unresolvedTargetCount: input.unresolvedTargetCount,
    voiceNoteId: input.voiceNoteId,
  };
}

async function findActiveProposalForVoiceNote(input: {
  tenantId: string;
  voiceNoteId: string;
}) {
  return prisma.aIProposal.findFirst({
    orderBy: { createdAt: "desc" },
    where: {
      archivedAt: null,
      sourceVoiceNoteId: input.voiceNoteId,
      status: {
        in: [...ACTIVE_PROPOSAL_STATUSES],
      },
      tenantId: input.tenantId,
    },
  });
}

export async function structureTenantVoiceNoteIntoAIProposal(
  context: TenantContext,
  voiceNoteId: string,
  provider: TranscriptStructuringProvider = getTranscriptStructuringProvider(),
) {
  await requireTenantAccess(context);

  const voiceNote = await prisma.voiceNote.findFirst({
    include: {
      company: { select: { id: true, name: true } },
      meeting: { select: { id: true, title: true } },
      note: { select: { id: true, noteType: true, summary: true } },
      person: { select: { displayName: true, id: true } },
    },
    where: {
      archivedAt: null,
      id: voiceNoteId,
      tenantId: context.tenantId,
    },
  });

  if (!voiceNote) {
    throw new TenantScopedEntityNotFoundError("VOICE_NOTE", voiceNoteId);
  }

  const transcript = transcriptForVoiceNote(voiceNote);
  const existingProposal = await findActiveProposalForVoiceNote({
    tenantId: context.tenantId,
    voiceNoteId: voiceNote.id,
  });

  if (existingProposal) {
    return {
      proposal: existingProposal,
      reusedExistingProposal: true,
    };
  }

  const directory = await loadCandidateDirectory({
    tenantId: context.tenantId,
    voiceNote,
  });
  const sourceContext = sourceContextForVoiceNote(voiceNote);
  const providerInput = {
    candidates: directory.candidates,
    sourceContext,
    transcript,
  } satisfies TranscriptStructuringInput;
  const providerResult = parseTranscriptStructuringResult(
    await provider.structureTranscript(providerInput),
  );
  const normalizedItems = await normalizeStructuredItems({
    directory,
    items: providerResult.items,
    tenantId: context.tenantId,
    voiceNoteId: voiceNote.id,
  });

  if (normalizedItems.length === 0) {
    throw new TranscriptStructuringProviderError({
      code: "no_structured_items",
      safeMessage: "Transcript structuring returned no proposal items.",
      statusCode: 502,
    });
  }

  return prisma.$transaction(
    async (tx) => {
      const existingInsideTransaction = await findVoiceNoteById(
        {
          tenantId: context.tenantId,
          voiceNoteId: voiceNote.id,
        },
        tx,
      );

      if (!existingInsideTransaction) {
        throw new TenantScopedEntityNotFoundError("VOICE_NOTE", voiceNote.id);
      }

      const proposal = await createAIProposal(
        {
          tenantId: context.tenantId,
          data: {
            confidence: providerResult.confidence,
            explanation: providerResult.explanation,
            proposalType: "VOICE_NOTE_EXTRACTION",
            sourceVoiceNoteId: voiceNote.id,
            status: "PENDING_REVIEW",
            summary: providerResult.summary,
            title: providerResult.proposalTitle,
            createdByUserId: context.userId,
          },
        },
        tx,
      );
      const createdItems = [];

      for (const item of normalizedItems) {
        await assertOptionalPolymorphicRelationshipBelongsToTenant(
          {
            tenantId: context.tenantId,
            entityId: item.targetEntityId,
            entityType: item.targetEntityType,
            label: "AIProposalItem target",
          },
          tx,
        );

        createdItems.push(
          await createAIProposalItem(
            {
              tenantId: context.tenantId,
              data: {
                actionType: item.actionType,
                aiProposalId: proposal.id,
                confidence: item.confidence,
                createdByUserId: context.userId,
                explanation: item.explanation,
                proposedPatch: item.proposedPatch,
                status: item.status,
                targetEntityId: item.targetEntityId,
                targetEntityType: item.targetEntityType,
              },
            },
            tx,
          ),
        );
      }

      const resolvedTargetCount = createdItems.filter(
        (item) => item.targetEntityId !== null,
      ).length;
      const metadata = creationAuditMetadata({
        itemCount: createdItems.length,
        proposalId: proposal.id,
        providerName: provider.name,
        resolvedTargetCount,
        transcriptLength: transcript.length,
        unresolvedTargetCount: createdItems.length - resolvedTargetCount,
        voiceNoteId: voiceNote.id,
      });

      await writeAuditLog(
        {
          action: "voice_note.proposal_requested",
          actorUserId: context.userId,
          entityId: voiceNote.id,
          entityType: "VoiceNote",
          metadata,
          tenantId: context.tenantId,
        },
        tx,
      );
      await writeAuditLog(
        {
          action: "ai_proposal.created_from_voice_note",
          actorUserId: context.userId,
          entityId: proposal.id,
          entityType: "AIProposal",
          metadata,
          tenantId: context.tenantId,
        },
        tx,
      );
      await writeAuditLog(
        {
          action: "ai_proposal_item.created_from_voice_note",
          actorUserId: context.userId,
          entityId: proposal.id,
          entityType: "AIProposal",
          metadata,
          tenantId: context.tenantId,
        },
        tx,
      );

      return {
        proposal,
        reusedExistingProposal: false,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
