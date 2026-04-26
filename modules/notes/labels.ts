import type { NoteType, RecordSourceType, Sensitivity } from "@prisma/client";

export const editableNoteTypes = [
  "GENERAL",
  "PERSON",
  "COMPANY",
  "MEETING",
  "SOURCE_EXCERPT",
] as const satisfies readonly NoteType[];

export const editableSensitivityTypes = [
  "NORMAL",
  "SENSITIVE_BUSINESS",
  "PERSONAL",
  "CONFIDENTIAL",
  "DO_NOT_USE_IN_OUTREACH",
  "DO_NOT_SHARE",
] as const satisfies readonly Sensitivity[];

export const editableNoteSourceTypes = [
  "MANUAL",
  "TEAMS_COPILOT_PASTE",
  "LINKEDIN_USER_PROVIDED",
] as const satisfies readonly RecordSourceType[];

const noteTypeLabels: Record<NoteType, string> = {
  COMPANY: "Company note",
  GENERAL: "General note",
  MEETING: "Meeting note",
  PERSON: "Person note",
  SOURCE_EXCERPT: "Source excerpt",
};

const sensitivityLabels: Record<Sensitivity, string> = {
  CONFIDENTIAL: "Confidential",
  DO_NOT_SHARE: "Do not share",
  DO_NOT_USE_IN_OUTREACH: "Do not use in outreach",
  NORMAL: "Normal",
  PERSONAL: "Personal",
  SENSITIVE_BUSINESS: "Sensitive business",
};

const sourceTypeLabels: Record<RecordSourceType, string> = {
  LINKEDIN_USER_PROVIDED: "LinkedIn user-provided",
  MANUAL: "Manual",
  TEAMS_COPILOT_PASTE: "Teams/Copilot paste",
};

export function noteTypeLabel(noteType: NoteType) {
  return noteTypeLabels[noteType];
}

export function sensitivityLabel(sensitivity: Sensitivity) {
  return sensitivityLabels[sensitivity];
}

export function recordSourceTypeLabel(sourceType: RecordSourceType) {
  return sourceTypeLabels[sourceType];
}

export function sensitivityVariant(sensitivity: Sensitivity) {
  return sensitivity === "NORMAL" ? "outline" : "sensitive";
}

export function formatNoteDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function notePreview(input: {
  body: string | null | undefined;
  summary: string | null | undefined;
}) {
  const text = input.summary?.trim() || input.body?.trim() || "No preview yet.";

  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}
