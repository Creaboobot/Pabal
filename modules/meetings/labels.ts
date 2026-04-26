import type {
  MeetingParticipantRole,
  RecordSourceType,
} from "@prisma/client";

export const editableRecordSourceTypes = [
  "MANUAL",
  "TEAMS_COPILOT_PASTE",
] as const satisfies readonly RecordSourceType[];

export const editableMeetingParticipantRoles = [
  "UNKNOWN",
  "ORGANIZER",
  "HOST",
  "ATTENDEE",
  "OPTIONAL",
] as const satisfies readonly MeetingParticipantRole[];

const sourceTypeLabels: Record<RecordSourceType, string> = {
  LINKEDIN_USER_PROVIDED: "LinkedIn user-provided",
  MANUAL: "Manual",
  TEAMS_COPILOT_PASTE: "Teams/Copilot paste",
};

const participantRoleLabels: Record<MeetingParticipantRole, string> = {
  ATTENDEE: "Attendee",
  HOST: "Host",
  OPTIONAL: "Optional",
  ORGANIZER: "Organizer",
  UNKNOWN: "Unknown",
};

export function recordSourceTypeLabel(sourceType: RecordSourceType) {
  return sourceTypeLabels[sourceType];
}

export function meetingParticipantRoleLabel(role: MeetingParticipantRole) {
  return participantRoleLabels[role];
}

export function formatMeetingDateTime(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : "No date";
}

export function formatDateTimeLocal(date: Date | null | undefined) {
  if (!date) {
    return "";
  }

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
