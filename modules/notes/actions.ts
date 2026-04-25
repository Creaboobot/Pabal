"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { NotesActionState } from "@/modules/notes/action-state";
import {
  formDataValue,
  formDataValues,
  noteFormSchema,
  pastedMeetingCaptureFormSchema,
  toFieldErrors,
} from "@/modules/notes/validation";
import { createTenantPastedMeetingCapture } from "@/server/services/capture";
import { DuplicateMeetingParticipantError } from "@/server/services/meetings";
import {
  archiveTenantNote,
  createTenantNote,
  updateTenantNote,
} from "@/server/services/notes";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { getCurrentUserContext } from "@/server/services/session";

async function requireActionContext(callbackUrl: string) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return context;
}

function noteFormData(formData: FormData) {
  return {
    body: formDataValue(formData, "body"),
    companyId: formDataValue(formData, "companyId"),
    meetingId: formDataValue(formData, "meetingId"),
    noteType: formDataValue(formData, "noteType"),
    personId: formDataValue(formData, "personId"),
    sensitivity: formDataValue(formData, "sensitivity"),
    sourceType: formDataValue(formData, "sourceType"),
    summary: formDataValue(formData, "summary"),
  };
}

function pastedMeetingCaptureFormData(formData: FormData) {
  return {
    body: formDataValue(formData, "body"),
    endedAt: formDataValue(formData, "endedAt"),
    occurredAt: formDataValue(formData, "occurredAt"),
    participantPersonIds: formDataValues(formData, "participantPersonIds"),
    primaryCompanyId: formDataValue(formData, "primaryCompanyId"),
    sensitivity: formDataValue(formData, "sensitivity"),
    summary: formDataValue(formData, "summary"),
    title: formDataValue(formData, "title"),
  };
}

function inputDateTime(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function noteRedirectPath(note: {
  companyId: string | null;
  id: string;
  meetingId: string | null;
  personId: string | null;
}) {
  if (note.meetingId) {
    return `/meetings/${note.meetingId}`;
  }

  if (note.personId) {
    return `/people/${note.personId}`;
  }

  if (note.companyId) {
    return `/people/companies/${note.companyId}`;
  }

  return "/capture";
}

function revalidateNoteContext(note: {
  companyId: string | null;
  id: string;
  meetingId: string | null;
  personId: string | null;
}) {
  revalidatePath("/capture");
  revalidatePath(`/notes/${note.id}`);

  if (note.meetingId) {
    revalidatePath("/meetings");
    revalidatePath(`/meetings/${note.meetingId}`);
  }

  if (note.personId) {
    revalidatePath("/people");
    revalidatePath(`/people/${note.personId}`);
  }

  if (note.companyId) {
    revalidatePath("/people/companies");
    revalidatePath(`/people/companies/${note.companyId}`);
  }
}

function mutationError(error: unknown): NotesActionState {
  if (error instanceof TenantScopedEntityNotFoundError) {
    return {
      message: "That record was not found in this workspace.",
      status: "error",
    };
  }

  if (error instanceof DuplicateMeetingParticipantError) {
    return {
      message: "One of the selected participants is already on the meeting.",
      status: "error",
    };
  }

  return {
    message: "The note could not be saved. Please try again.",
    status: "error",
  };
}

export async function createNoteAction(
  formData: FormData,
): Promise<NotesActionState> {
  const parsed = noteFormSchema.safeParse(noteFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext("/notes/new");

  try {
    const note = await createTenantNote(context, parsed.data);

    revalidateNoteContext(note);

    return {
      redirectTo: `/notes/${note.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function createMeetingNoteAction(
  meetingId: string,
  formData: FormData,
): Promise<NotesActionState> {
  const parsed = noteFormSchema.safeParse({
    ...noteFormData(formData),
    meetingId,
    noteType: "MEETING",
  });

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(
    `/meetings/${meetingId}/notes/new`,
  );

  try {
    const note = await createTenantNote(context, {
      ...parsed.data,
      meetingId,
    });

    revalidateNoteContext(note);

    return {
      redirectTo: `/notes/${note.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateNoteAction(
  noteId: string,
  formData: FormData,
): Promise<NotesActionState> {
  const parsed = noteFormSchema.safeParse(noteFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/notes/${noteId}/edit`);

  try {
    const note = await updateTenantNote(context, noteId, parsed.data);

    revalidateNoteContext(note);

    return {
      redirectTo: `/notes/${note.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archiveNoteAction(
  noteId: string,
): Promise<NotesActionState> {
  const context = await requireActionContext(`/notes/${noteId}`);

  try {
    const note = await archiveTenantNote(context, noteId);

    revalidateNoteContext(note);

    return {
      redirectTo: noteRedirectPath(note),
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function createPastedMeetingCaptureAction(
  formData: FormData,
): Promise<NotesActionState> {
  const parsed = pastedMeetingCaptureFormSchema.safeParse(
    pastedMeetingCaptureFormData(formData),
  );

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext("/capture/meeting");

  try {
    const result = await createTenantPastedMeetingCapture(context, {
      body: parsed.data.body,
      endedAt: inputDateTime(parsed.data.endedAt),
      occurredAt: inputDateTime(parsed.data.occurredAt) ?? new Date(),
      participantPersonIds: parsed.data.participantPersonIds,
      primaryCompanyId: parsed.data.primaryCompanyId,
      sensitivity: parsed.data.sensitivity,
      summary: parsed.data.summary,
      title: parsed.data.title,
    });

    revalidatePath("/capture");
    revalidatePath("/meetings");
    revalidatePath(`/meetings/${result.meeting.id}`);
    revalidatePath(`/notes/${result.note.id}`);

    if (result.meeting.primaryCompanyId) {
      revalidatePath(`/people/companies/${result.meeting.primaryCompanyId}`);
    }

    return {
      redirectTo: `/meetings/${result.meeting.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}
