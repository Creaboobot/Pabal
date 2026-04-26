import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUserContext } from "@/server/services/session";
import {
  mapVoiceTranscriptionError,
  parseOptionalVoiceContextId,
  parseOptionalVoiceDuration,
  transcribeTenantVoiceNote,
} from "@/server/services/voice-transcription";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
    },
  );
}

export async function POST(request: NextRequest) {
  const context = await getCurrentUserContext();

  if (!context) {
    return jsonError("Authentication is required.", 401);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError("Expected multipart form data.", 400);
  }

  try {
    const voiceNote = await transcribeTenantVoiceNote(context, {
      audio: formData.get("audio") as File,
      audioDurationSeconds: parseOptionalVoiceDuration(
        formData.get("audioDurationSeconds") ?? formData.get("durationSeconds"),
      ),
      companyId: parseOptionalVoiceContextId(
        formData.get("companyId"),
        "companyId",
      ),
      meetingId: parseOptionalVoiceContextId(
        formData.get("meetingId"),
        "meetingId",
      ),
      noteId: parseOptionalVoiceContextId(formData.get("noteId"), "noteId"),
      personId: parseOptionalVoiceContextId(
        formData.get("personId"),
        "personId",
      ),
    });

    return NextResponse.json({
      redirectTo: `/voice-notes/${voiceNote.id}`,
      voiceNoteId: voiceNote.id,
    });
  } catch (error) {
    const mapped = mapVoiceTranscriptionError(error);

    return jsonError(mapped.message, mapped.status);
  }
}
