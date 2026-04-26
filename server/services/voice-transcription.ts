import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { getSpeechToTextProvider } from "@/server/providers/speech-to-text";
import {
  SpeechToTextProviderError,
  type SpeechToTextProvider,
} from "@/server/providers/speech-to-text/types";
import { createVoiceNote } from "@/server/repositories/voice-notes";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  assertOptionalRelationshipEntityBelongsToTenant,
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export const MAX_VOICE_AUDIO_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_VOICE_AUDIO_DURATION_SECONDS = 5 * 60;
export const MAX_VOICE_TRANSCRIPT_LENGTH = 80000;

export const allowedVoiceAudioMimeTypes = [
  "audio/webm",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/mpga",
  "audio/m4a",
] as const;

export type AllowedVoiceAudioMimeType =
  (typeof allowedVoiceAudioMimeTypes)[number];

export type VoiceTranscriptionSourceContext = {
  companyId?: string | null;
  meetingId?: string | null;
  noteId?: string | null;
  personId?: string | null;
};

export type TranscribeTenantVoiceNoteInput = VoiceTranscriptionSourceContext & {
  audio: File;
  audioDurationSeconds?: number | null;
};

export class VoiceTranscriptionValidationError extends Error {
  readonly field: string;
  readonly statusCode = 400;

  constructor(field: string, message: string) {
    super(message);
    this.name = "VoiceTranscriptionValidationError";
    this.field = field;
  }
}

function normalizeMimeType(value: string) {
  return value.split(";")[0]?.trim().toLowerCase() ?? "";
}

export function isAllowedVoiceAudioMimeType(
  value: string,
): value is AllowedVoiceAudioMimeType {
  return allowedVoiceAudioMimeTypes.includes(
    normalizeMimeType(value) as AllowedVoiceAudioMimeType,
  );
}

export function parseOptionalVoiceDuration(value: FormDataEntryValue | null) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new VoiceTranscriptionValidationError(
      "audioDurationSeconds",
      "Recording duration must be a number.",
    );
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new VoiceTranscriptionValidationError(
      "audioDurationSeconds",
      "Recording duration must be a valid non-negative number.",
    );
  }

  if (parsed > MAX_VOICE_AUDIO_DURATION_SECONDS) {
    throw new VoiceTranscriptionValidationError(
      "audioDurationSeconds",
      "Recording is longer than the 5 minute limit.",
    );
  }

  return Math.round(parsed);
}

export function parseOptionalVoiceContextId(
  value: FormDataEntryValue | null,
  field: string,
) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new VoiceTranscriptionValidationError(
      field,
      "Context id must be a string.",
    );
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > 128) {
    throw new VoiceTranscriptionValidationError(
      field,
      "Context id is too long.",
    );
  }

  return trimmed;
}

export function validateVoiceAudioFile(audio: unknown) {
  if (!(audio instanceof File)) {
    throw new VoiceTranscriptionValidationError(
      "audio",
      "Audio file is required.",
    );
  }

  if (audio.size <= 0) {
    throw new VoiceTranscriptionValidationError(
      "audio",
      "Audio file is empty.",
    );
  }

  if (audio.size > MAX_VOICE_AUDIO_SIZE_BYTES) {
    throw new VoiceTranscriptionValidationError(
      "audio",
      "Audio file is larger than the 25 MB limit.",
    );
  }

  const mimeType = normalizeMimeType(audio.type);

  if (!isAllowedVoiceAudioMimeType(mimeType)) {
    throw new VoiceTranscriptionValidationError(
      "audio",
      "Audio file type is not supported.",
    );
  }

  return {
    fileName: audio.name || "voice-note",
    mimeType,
    sizeBytes: audio.size,
  };
}

function normalizeTranscriptText(value: string) {
  const transcriptText = value.trim();

  if (transcriptText.length === 0) {
    throw new VoiceTranscriptionValidationError(
      "transcriptText",
      "Transcription returned no transcript.",
    );
  }

  if (transcriptText.length > MAX_VOICE_TRANSCRIPT_LENGTH) {
    throw new VoiceTranscriptionValidationError(
      "transcriptText",
      "Transcript is longer than the 80,000 character limit.",
    );
  }

  return transcriptText;
}

async function validateVoiceNoteSourceContext(
  context: TenantContext,
  data: VoiceTranscriptionSourceContext,
) {
  await Promise.all([
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "PERSON",
      entityId: data.personId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "COMPANY",
      entityId: data.companyId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "MEETING",
      entityId: data.meetingId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "NOTE",
      entityId: data.noteId,
    }),
  ]);
}

function safeTranscriptionAuditMetadata(input: {
  audioDurationSeconds: number | null;
  audioMimeType: string;
  audioSizeBytes: number;
  providerName: string;
  sourceContext: VoiceTranscriptionSourceContext;
  status: string;
  transcriptLength: number;
  voiceNoteId: string;
}) {
  return {
    audioDurationSeconds: input.audioDurationSeconds,
    audioMimeType: input.audioMimeType,
    audioSizeBytes: input.audioSizeBytes,
    companyId: input.sourceContext.companyId ?? null,
    meetingId: input.sourceContext.meetingId ?? null,
    noteId: input.sourceContext.noteId ?? null,
    personId: input.sourceContext.personId ?? null,
    providerName: input.providerName,
    status: input.status,
    transcriptLength: input.transcriptLength,
    voiceNoteId: input.voiceNoteId,
  };
}

export async function transcribeTenantVoiceNote(
  context: TenantContext,
  data: TranscribeTenantVoiceNoteInput,
  provider: SpeechToTextProvider = getSpeechToTextProvider(),
) {
  await requireTenantAccess(context);

  const audio = validateVoiceAudioFile(data.audio);
  const audioDurationSeconds = data.audioDurationSeconds ?? null;
  const sourceContext = {
    companyId: data.companyId ?? null,
    meetingId: data.meetingId ?? null,
    noteId: data.noteId ?? null,
    personId: data.personId ?? null,
  } satisfies VoiceTranscriptionSourceContext;

  await validateVoiceNoteSourceContext(context, sourceContext);

  const transcription = await provider.transcribe({
    audio: data.audio,
    durationSeconds: audioDurationSeconds,
    fileName: audio.fileName,
    mimeType: audio.mimeType,
    sizeBytes: audio.sizeBytes,
  });
  const transcriptText = normalizeTranscriptText(transcription.text);
  const rawAudioDeletedAt = new Date();

  return prisma.$transaction(
    async (tx) => {
      const voiceNote = await createVoiceNote(
        {
          tenantId: context.tenantId,
          data: {
            audioDurationSeconds,
            audioMimeType: audio.mimeType,
            audioRetentionStatus: "NOT_STORED",
            audioSizeBytes: audio.sizeBytes,
            companyId: sourceContext.companyId,
            createdByUserId: context.userId,
            language: transcription.language ?? null,
            meetingId: sourceContext.meetingId,
            noteId: sourceContext.noteId,
            personId: sourceContext.personId,
            rawAudioDeletedAt,
            status: "TRANSCRIBED",
            transcriptConfidence: transcription.confidence ?? null,
            transcriptText,
            updatedByUserId: context.userId,
          },
        },
        tx,
      );
      const metadata = safeTranscriptionAuditMetadata({
        audioDurationSeconds,
        audioMimeType: audio.mimeType,
        audioSizeBytes: audio.sizeBytes,
        providerName: provider.name,
        sourceContext,
        status: voiceNote.status,
        transcriptLength: transcriptText.length,
        voiceNoteId: voiceNote.id,
      });

      await writeAuditLog(
        {
          tenantId: context.tenantId,
          actorUserId: context.userId,
          action: "voice_note.created",
          entityType: "VoiceNote",
          entityId: voiceNote.id,
          metadata,
        },
        tx,
      );

      await writeAuditLog(
        {
          tenantId: context.tenantId,
          actorUserId: context.userId,
          action: "voice_note.transcribed",
          entityType: "VoiceNote",
          entityId: voiceNote.id,
          metadata,
        },
        tx,
      );

      return voiceNote;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export function mapVoiceTranscriptionError(error: unknown) {
  if (error instanceof VoiceTranscriptionValidationError) {
    return {
      message: error.message,
      status: error.statusCode,
    };
  }

  if (error instanceof TenantScopedEntityNotFoundError) {
    return {
      message: "Linked source context was not found.",
      status: 404,
    };
  }

  if (error instanceof SpeechToTextProviderError) {
    return {
      message: error.safeMessage,
      status: error.statusCode ?? 502,
    };
  }

  return {
    message: "Voice transcription failed. Please try again.",
    status: 500,
  };
}
