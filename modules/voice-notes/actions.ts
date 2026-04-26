"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { VoiceNotesActionState } from "@/modules/voice-notes/action-state";
import {
  formDataValue,
  toFieldErrors,
  voiceNoteReviewFormSchema,
} from "@/modules/voice-notes/validation";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { getCurrentUserContext } from "@/server/services/session";
import {
  archiveTenantVoiceNote,
  updateTenantVoiceNoteReview,
} from "@/server/services/voice-notes";

async function requireActionContext(callbackUrl: string) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return context;
}

function voiceNoteFormData(formData: FormData) {
  return {
    companyId: formDataValue(formData, "companyId"),
    editedTranscriptText: formDataValue(formData, "editedTranscriptText"),
    meetingId: formDataValue(formData, "meetingId"),
    noteId: formDataValue(formData, "noteId"),
    personId: formDataValue(formData, "personId"),
    title: formDataValue(formData, "title"),
  };
}

function revalidateVoiceNoteContext(voiceNote: {
  companyId: string | null;
  id: string;
  meetingId: string | null;
  noteId: string | null;
  personId: string | null;
}) {
  revalidatePath("/capture");
  revalidatePath(`/voice-notes/${voiceNote.id}`);
  revalidatePath(`/voice-notes/${voiceNote.id}/edit`);

  if (voiceNote.personId) {
    revalidatePath(`/people/${voiceNote.personId}`);
  }

  if (voiceNote.companyId) {
    revalidatePath(`/people/companies/${voiceNote.companyId}`);
  }

  if (voiceNote.meetingId) {
    revalidatePath(`/meetings/${voiceNote.meetingId}`);
  }

  if (voiceNote.noteId) {
    revalidatePath(`/notes/${voiceNote.noteId}`);
  }
}

function mutationError(error: unknown): VoiceNotesActionState {
  if (error instanceof TenantScopedEntityNotFoundError) {
    return {
      message: "That record was not found in this workspace.",
      status: "error",
    };
  }

  return {
    message: "The voice note could not be saved. Please try again.",
    status: "error",
  };
}

export async function updateVoiceNoteAction(
  voiceNoteId: string,
  formData: FormData,
): Promise<VoiceNotesActionState> {
  const parsed = voiceNoteReviewFormSchema.safeParse(
    voiceNoteFormData(formData),
  );

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/voice-notes/${voiceNoteId}/edit`);

  try {
    const voiceNote = await updateTenantVoiceNoteReview(
      context,
      voiceNoteId,
      parsed.data,
    );

    revalidateVoiceNoteContext(voiceNote);

    return {
      redirectTo: `/voice-notes/${voiceNote.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archiveVoiceNoteAction(
  voiceNoteId: string,
): Promise<VoiceNotesActionState> {
  const context = await requireActionContext(`/voice-notes/${voiceNoteId}`);

  try {
    const voiceNote = await archiveTenantVoiceNote(context, voiceNoteId);

    revalidateVoiceNoteContext(voiceNote);

    return {
      redirectTo: "/capture",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}
