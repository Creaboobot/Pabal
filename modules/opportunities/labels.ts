import type {
  CapabilityStatus,
  CapabilityType,
  IntroductionSuggestionStatus,
  NeedStatus,
  NeedType,
  Sensitivity,
  TaskPriority,
} from "@prisma/client";

export const editableNeedTypes = [
  "PROBLEM",
  "REQUIREMENT",
  "REQUEST",
  "OPPORTUNITY",
  "INTEREST",
  "RISK",
  "QUESTION",
  "UNKNOWN",
] as const satisfies readonly NeedType[];

export const editableNeedStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "ADDRESSED",
  "PARKED",
  "CLOSED",
] as const satisfies readonly NeedStatus[];

export const editableCapabilityTypes = [
  "EXPERTISE",
  "ACCESS",
  "ASSET",
  "SERVICE_POTENTIAL",
  "EXPERIENCE",
  "SOLUTION",
  "OTHER",
] as const satisfies readonly CapabilityType[];

export const editableCapabilityStatuses = [
  "ACTIVE",
  "PARKED",
  "RETIRED",
  "ARCHIVED",
] as const satisfies readonly CapabilityStatus[];

export const editablePriorities = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const satisfies readonly TaskPriority[];

export const editableSensitivities = [
  "NORMAL",
  "SENSITIVE_BUSINESS",
  "PERSONAL",
  "CONFIDENTIAL",
  "DO_NOT_USE_IN_OUTREACH",
  "DO_NOT_SHARE",
] as const satisfies readonly Sensitivity[];

export const editableIntroductionStatuses = [
  "PROPOSED",
  "ACCEPTED",
  "OPT_IN_REQUESTED",
  "INTRO_SENT",
  "COMPLETED",
  "REJECTED",
  "PARKED",
] as const satisfies readonly IntroductionSuggestionStatus[];

export function needTypeLabel(type: NeedType) {
  const labels: Record<NeedType, string> = {
    INTEREST: "Interest",
    OPPORTUNITY: "Opportunity",
    PROBLEM: "Problem",
    QUESTION: "Question",
    REQUEST: "Request",
    REQUIREMENT: "Requirement",
    RISK: "Risk",
    UNKNOWN: "Unknown",
  };

  return labels[type];
}

export function needStatusLabel(status: NeedStatus) {
  const labels: Record<NeedStatus, string> = {
    ADDRESSED: "Addressed",
    CLOSED: "Closed",
    IN_PROGRESS: "In progress",
    OPEN: "Open",
    PARKED: "Parked",
  };

  return labels[status];
}

export function capabilityTypeLabel(type: CapabilityType) {
  const labels: Record<CapabilityType, string> = {
    ACCESS: "Access",
    ASSET: "Asset",
    EXPERIENCE: "Experience",
    EXPERTISE: "Expertise",
    OTHER: "Other",
    SERVICE_POTENTIAL: "Service potential",
    SOLUTION: "Solution",
  };

  return labels[type];
}

export function capabilityStatusLabel(status: CapabilityStatus) {
  const labels: Record<CapabilityStatus, string> = {
    ACTIVE: "Active",
    ARCHIVED: "Archived",
    PARKED: "Parked",
    RETIRED: "Retired",
  };

  return labels[status];
}

export function introductionStatusLabel(status: IntroductionSuggestionStatus) {
  const labels: Record<IntroductionSuggestionStatus, string> = {
    ACCEPTED: "Accepted",
    COMPLETED: "Completed",
    INTRO_SENT: "Intro sent",
    OPT_IN_REQUESTED: "Opt-in requested",
    PARKED: "Parked",
    PROPOSED: "Proposed",
    REJECTED: "Rejected",
  };

  return labels[status];
}

export function priorityLabel(priority: TaskPriority) {
  const labels: Record<TaskPriority, string> = {
    CRITICAL: "Critical",
    HIGH: "High",
    LOW: "Low",
    MEDIUM: "Medium",
  };

  return labels[priority];
}

export function sensitivityLabel(sensitivity: Sensitivity) {
  const labels: Record<Sensitivity, string> = {
    CONFIDENTIAL: "Confidential",
    DO_NOT_SHARE: "Do not share",
    DO_NOT_USE_IN_OUTREACH: "Do not use in outreach",
    NORMAL: "Normal",
    PERSONAL: "Personal",
    SENSITIVE_BUSINESS: "Sensitive business",
  };

  return labels[sensitivity];
}

export function confidenceLabel(confidence: number | null | undefined) {
  if (confidence === null || confidence === undefined) {
    return "Confidence unknown";
  }

  return `${Math.round(confidence * 100)}% confidence`;
}

export function truncatedText(text: string, max = 80) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export function introductionDisplayTitle(suggestion: {
  capability?: { title: string } | null;
  fromCompany?: { name: string } | null;
  fromPerson?: { displayName: string } | null;
  need?: { title: string } | null;
  rationale: string;
  toCompany?: { name: string } | null;
  toPerson?: { displayName: string } | null;
}) {
  if (suggestion.need && suggestion.capability) {
    return `${suggestion.need.title} <> ${suggestion.capability.title}`;
  }

  const from = suggestion.fromPerson?.displayName ?? suggestion.fromCompany?.name;
  const to = suggestion.toPerson?.displayName ?? suggestion.toCompany?.name;

  if (from && to) {
    return `${from} <> ${to}`;
  }

  if (suggestion.rationale.trim().length > 0) {
    return truncatedText(suggestion.rationale.trim(), 80);
  }

  return "Legacy relationship suggestion";
}
