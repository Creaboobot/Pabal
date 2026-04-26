import type {
  VoiceAudioRetentionStatus,
  VoiceNoteStatus,
} from "@prisma/client";

export function voiceNoteStatusLabel(status: VoiceNoteStatus) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "AWAITING_TRANSCRIPTION":
      return "Awaiting transcription";
    case "TRANSCRIBED":
      return "Transcribed";
    case "TRANSCRIPTION_FAILED":
      return "Transcription failed";
    case "READY_FOR_REVIEW":
      return "Ready for review";
    case "REVIEWED":
      return "Reviewed";
    case "DELETED":
      return "Deleted";
  }
}

export function voiceAudioRetentionStatusLabel(
  status: VoiceAudioRetentionStatus,
) {
  switch (status) {
    case "NOT_STORED":
      return "Raw audio not stored";
    case "PENDING_DELETION":
      return "Raw audio pending deletion";
    case "DELETED":
      return "Raw audio deleted";
    case "RETAINED_WITH_CONSENT":
      return "Retained with consent";
  }
}

export function formatVoiceDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatVoiceDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) {
    return "Unknown duration";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function formatVoiceConfidence(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Confidence unavailable";
  }

  return `${Math.round(value * 100)}% confidence`;
}
