import type {
  AIProposalActionType,
  AIProposalItemStatus,
  AIProposalStatus,
  AIProposalType,
  SourceEntityType,
} from "@prisma/client";

export function proposalTypeLabel(proposalType: AIProposalType) {
  const labels: Record<AIProposalType, string> = {
    FOLLOW_UP_SUGGESTION: "Follow-up suggestion",
    INTRODUCTION_SUGGESTION: "Introduction suggestion",
    MEETING_EXTRACTION: "Meeting extraction",
    NOTE_EXTRACTION: "Note extraction",
    OTHER: "Other",
    RELATIONSHIP_UPDATE: "Relationship update",
    VOICE_NOTE_EXTRACTION: "Voice note extraction",
  };

  return labels[proposalType];
}

export function proposalStatusLabel(status: AIProposalStatus) {
  const labels: Record<AIProposalStatus, string> = {
    APPROVED: "Approved",
    DISMISSED: "Dismissed",
    IN_REVIEW: "In review",
    PARTIALLY_APPROVED: "Partially approved",
    PENDING_REVIEW: "Pending review",
    REJECTED: "Rejected",
  };

  return labels[status];
}

export function proposalItemStatusLabel(status: AIProposalItemStatus) {
  const labels: Record<AIProposalItemStatus, string> = {
    APPROVED: "Approved",
    NEEDS_CLARIFICATION: "Needs clarification",
    PENDING_REVIEW: "Pending review",
    REJECTED: "Rejected",
  };

  return labels[status];
}

export function proposalActionTypeLabel(actionType: AIProposalActionType) {
  const labels: Record<AIProposalActionType, string> = {
    ARCHIVE: "Archive",
    CREATE: "Create",
    LINK: "Link",
    NO_OP: "No operation",
    UNLINK: "Unlink",
    UPDATE: "Update",
  };

  return labels[actionType];
}

export function sourceEntityTypeLabel(entityType: SourceEntityType) {
  const labels: Record<SourceEntityType, string> = {
    AI_PROPOSAL: "AI proposal",
    AI_PROPOSAL_ITEM: "AI proposal item",
    CAPABILITY: "Capability",
    COMMITMENT: "Commitment",
    COMPANY: "Company",
    COMPANY_AFFILIATION: "Company affiliation",
    INTRODUCTION_SUGGESTION: "Introduction suggestion",
    MEETING: "Meeting",
    MEETING_PARTICIPANT: "Meeting participant",
    NEED: "Need",
    NOTE: "Note",
    PERSON: "Person",
    TASK: "Task",
    VOICE_MENTION: "Voice mention",
    VOICE_NOTE: "Voice note",
  };

  return labels[entityType];
}

export function confidenceLabel(confidence: number | null | undefined) {
  if (confidence === null || confidence === undefined) {
    return "Confidence unknown";
  }

  return `${Math.round(confidence * 100)}% confidence`;
}

export function proposalStatusVariant(status: AIProposalStatus) {
  if (status === "APPROVED") {
    return "default" as const;
  }

  if (status === "REJECTED" || status === "DISMISSED") {
    return "sensitive" as const;
  }

  return "secondary" as const;
}

export function proposalItemStatusVariant(status: AIProposalItemStatus) {
  if (status === "APPROVED") {
    return "default" as const;
  }

  if (status === "REJECTED") {
    return "sensitive" as const;
  }

  return "secondary" as const;
}
