"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MeetingActionState } from "@/modules/meetings/action-state";
import {
  formDataValue,
  meetingFormSchema,
  meetingParticipantFormSchema,
  toFieldErrors,
} from "@/modules/meetings/validation";
import { createTenantMeetingFromAIProposalItem } from "@/server/services/ai-proposal-conversions";
import {
  archiveTenantMeeting,
  createTenantMeeting,
  createTenantMeetingParticipant,
  DuplicateMeetingParticipantError,
  InvalidMeetingParticipantInputError,
  removeTenantMeetingParticipant,
  updateTenantMeeting,
} from "@/server/services/meetings";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { getCurrentUserContext } from "@/server/services/session";

async function requireActionContext(callbackUrl: string) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return context;
}

function meetingFormData(formData: FormData) {
  return {
    endedAt: formDataValue(formData, "endedAt"),
    location: formDataValue(formData, "location"),
    occurredAt: formDataValue(formData, "occurredAt"),
    primaryCompanyId: formDataValue(formData, "primaryCompanyId"),
    sourceType: formDataValue(formData, "sourceType"),
    summary: formDataValue(formData, "summary"),
    title: formDataValue(formData, "title"),
  };
}

type ProposalConversionSource =
  | {
      aiProposalId: string;
      aiProposalItemId: string;
    }
  | "invalid"
  | null;

function optionalFormText(formData: FormData, key: string) {
  const value = formDataValue(formData, key);

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function proposalConversionSource(formData: FormData): ProposalConversionSource {
  const aiProposalId = optionalFormText(formData, "sourceAIProposalId");
  const aiProposalItemId = optionalFormText(
    formData,
    "sourceAIProposalItemId",
  );

  if (!aiProposalId && !aiProposalItemId) {
    return null;
  }

  if (!aiProposalId || !aiProposalItemId) {
    return "invalid";
  }

  return {
    aiProposalId,
    aiProposalItemId,
  };
}

function participantFormData(formData: FormData) {
  return {
    companyId: formDataValue(formData, "companyId"),
    emailSnapshot: formDataValue(formData, "emailSnapshot"),
    nameSnapshot: formDataValue(formData, "nameSnapshot"),
    participantRole: formDataValue(formData, "participantRole"),
    personId: formDataValue(formData, "personId"),
  };
}

function inputDateTime(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function mutationError(error: unknown): MeetingActionState {
  if (error instanceof TenantScopedEntityNotFoundError) {
    return {
      message: "That record was not found in this workspace.",
      status: "error",
    };
  }

  if (error instanceof DuplicateMeetingParticipantError) {
    return {
      message: "That person is already linked to this meeting.",
      status: "error",
    };
  }

  if (error instanceof InvalidMeetingParticipantInputError) {
    return {
      message: "Choose a known person or enter a participant snapshot.",
      status: "error",
    };
  }

  return {
    message: "The meeting record could not be saved. Please try again.",
    status: "error",
  };
}

export async function createMeetingAction(
  formData: FormData,
): Promise<MeetingActionState> {
  const parsed = meetingFormSchema.safeParse(meetingFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext("/meetings/new");
  const conversionSource = proposalConversionSource(formData);

  if (conversionSource === "invalid") {
    return {
      message: "The suggested update source could not be verified.",
      status: "error",
    };
  }

  try {
    const meetingPayload = {
      endedAt: inputDateTime(parsed.data.endedAt),
      location: parsed.data.location,
      occurredAt: inputDateTime(parsed.data.occurredAt),
      primaryCompanyId: parsed.data.primaryCompanyId,
      sourceType: parsed.data.sourceType,
      summary: parsed.data.summary,
      title: parsed.data.title,
    };
    const meeting = conversionSource
      ? await createTenantMeetingFromAIProposalItem(context, {
          ...conversionSource,
          meeting: meetingPayload,
        })
      : await createTenantMeeting(context, meetingPayload);

    if (!meeting) {
      return {
        message: "The existing converted meeting could not be found.",
        status: "error",
      };
    }

    revalidatePath("/capture");
    revalidatePath("/meetings");
    if (conversionSource) {
      revalidatePath("/proposals");
      revalidatePath(`/proposals/${conversionSource.aiProposalId}`);
    }

    return {
      redirectTo: `/meetings/${meeting.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateMeetingAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState> {
  const parsed = meetingFormSchema.safeParse(meetingFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/meetings/${meetingId}/edit`);

  try {
    const meeting = await updateTenantMeeting(context, meetingId, {
      endedAt: inputDateTime(parsed.data.endedAt),
      location: parsed.data.location,
      occurredAt: inputDateTime(parsed.data.occurredAt),
      primaryCompanyId: parsed.data.primaryCompanyId,
      sourceType: parsed.data.sourceType,
      summary: parsed.data.summary,
      title: parsed.data.title,
    });

    revalidatePath("/meetings");
    revalidatePath(`/meetings/${meeting.id}`);

    return {
      redirectTo: `/meetings/${meeting.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archiveMeetingAction(
  meetingId: string,
): Promise<MeetingActionState> {
  const context = await requireActionContext(`/meetings/${meetingId}`);

  try {
    await archiveTenantMeeting(context, meetingId);

    revalidatePath("/capture");
    revalidatePath("/meetings");

    return {
      redirectTo: "/meetings",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function createMeetingParticipantAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState> {
  const parsed = meetingParticipantFormSchema.safeParse(
    participantFormData(formData),
  );

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(
    `/meetings/${meetingId}/participants/new`,
  );

  try {
    const participant = await createTenantMeetingParticipant(context, {
      companyId: parsed.data.companyId,
      emailSnapshot: parsed.data.emailSnapshot,
      meetingId,
      nameSnapshot: parsed.data.nameSnapshot,
      participantRole: parsed.data.participantRole,
      personId: parsed.data.personId,
    });

    revalidatePath("/meetings");
    revalidatePath(`/meetings/${meetingId}`);

    if (participant.personId) {
      revalidatePath(`/people/${participant.personId}`);
    }

    if (participant.companyId) {
      revalidatePath(`/people/companies/${participant.companyId}`);
    }

    return {
      redirectTo: `/meetings/${meetingId}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function removeMeetingParticipantAction(
  meetingId: string,
  meetingParticipantId: string,
): Promise<MeetingActionState> {
  const context = await requireActionContext(`/meetings/${meetingId}`);

  try {
    const participant = await removeTenantMeetingParticipant(
      context,
      meetingId,
      meetingParticipantId,
    );

    revalidatePath("/meetings");
    revalidatePath(`/meetings/${meetingId}`);

    if (participant.personId) {
      revalidatePath(`/people/${participant.personId}`);
    }

    if (participant.companyId) {
      revalidatePath(`/people/companies/${participant.companyId}`);
    }

    return {
      redirectTo: `/meetings/${meetingId}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}
