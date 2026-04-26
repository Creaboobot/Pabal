import type {
  VoiceAudioRetentionStatus,
  VoiceNoteStatus,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  voiceAudioRetentionStatusLabel,
  voiceNoteStatusLabel,
} from "@/modules/voice-notes/labels";

type VoiceNoteStatusBadgeProps = {
  status: VoiceNoteStatus;
};

type VoiceRetentionBadgeProps = {
  status: VoiceAudioRetentionStatus;
};

export function VoiceNoteStatusBadge({ status }: VoiceNoteStatusBadgeProps) {
  const variant =
    status === "REVIEWED"
      ? "success"
      : status === "TRANSCRIPTION_FAILED"
        ? "warning"
        : "secondary";

  return <Badge variant={variant}>{voiceNoteStatusLabel(status)}</Badge>;
}

export function VoiceRetentionBadge({ status }: VoiceRetentionBadgeProps) {
  return (
    <Badge variant={status === "NOT_STORED" ? "success" : "outline"}>
      {voiceAudioRetentionStatusLabel(status)}
    </Badge>
  );
}
