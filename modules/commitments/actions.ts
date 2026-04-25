"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { CommitmentsActionState } from "@/modules/commitments/action-state";
import {
  commitmentFormSchema,
  formDataValue,
  type CommitmentFormValues,
  toFieldErrors,
} from "@/modules/commitments/validation";
import {
  InvalidCommitmentOwnerError,
  archiveTenantCommitment,
  cancelTenantCommitment,
  createTenantCommitment,
  fulfillTenantCommitment,
  updateTenantCommitment,
} from "@/server/services/commitments";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { getCurrentUserContext } from "@/server/services/session";

async function requireActionContext(callbackUrl: string) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return context;
}

function commitmentFormData(formData: FormData) {
  return {
    counterpartyCompanyId: formDataValue(formData, "counterpartyCompanyId"),
    counterpartyPersonId: formDataValue(formData, "counterpartyPersonId"),
    description: formDataValue(formData, "description"),
    dueAt: formDataValue(formData, "dueAt"),
    dueWindowEnd: formDataValue(formData, "dueWindowEnd"),
    dueWindowStart: formDataValue(formData, "dueWindowStart"),
    meetingId: formDataValue(formData, "meetingId"),
    noteId: formDataValue(formData, "noteId"),
    ownerCompanyId: formDataValue(formData, "ownerCompanyId"),
    ownerPersonId: formDataValue(formData, "ownerPersonId"),
    ownerType: formDataValue(formData, "ownerType"),
    sensitivity: formDataValue(formData, "sensitivity"),
    status: formDataValue(formData, "status"),
    title: formDataValue(formData, "title"),
  };
}

function inputDateTime(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function commitmentMutationPayload(data: CommitmentFormValues) {
  return {
    counterpartyCompanyId: data.counterpartyCompanyId,
    counterpartyPersonId: data.counterpartyPersonId,
    description: data.description,
    dueAt: inputDateTime(data.dueAt),
    dueWindowEnd: inputDateTime(data.dueWindowEnd),
    dueWindowStart: inputDateTime(data.dueWindowStart),
    meetingId: data.meetingId,
    noteId: data.noteId,
    ownerCompanyId: data.ownerCompanyId,
    ownerPersonId: data.ownerPersonId,
    ownerType: data.ownerType,
    sensitivity: data.sensitivity,
    status: data.status,
    title: data.title,
  };
}

function revalidateCommitmentContext(commitment: {
  counterpartyCompanyId: string | null;
  counterpartyPersonId: string | null;
  id: string;
  meetingId: string | null;
  noteId: string | null;
  ownerCompanyId: string | null;
  ownerPersonId: string | null;
}) {
  revalidatePath("/today");
  revalidatePath("/commitments");
  revalidatePath(`/commitments/${commitment.id}`);

  for (const personId of [
    commitment.ownerPersonId,
    commitment.counterpartyPersonId,
  ]) {
    if (personId) {
      revalidatePath(`/people/${personId}`);
    }
  }

  for (const companyId of [
    commitment.ownerCompanyId,
    commitment.counterpartyCompanyId,
  ]) {
    if (companyId) {
      revalidatePath(`/people/companies/${companyId}`);
    }
  }

  if (commitment.meetingId) {
    revalidatePath(`/meetings/${commitment.meetingId}`);
  }

  if (commitment.noteId) {
    revalidatePath(`/notes/${commitment.noteId}`);
  }
}

function mutationError(error: unknown): CommitmentsActionState {
  if (
    error instanceof TenantScopedEntityNotFoundError ||
    error instanceof InvalidCommitmentOwnerError
  ) {
    return {
      message: "That commitment could not be saved in this workspace.",
      status: "error",
    };
  }

  return {
    message: "The commitment could not be saved. Please try again.",
    status: "error",
  };
}

export async function createCommitmentAction(
  formData: FormData,
): Promise<CommitmentsActionState> {
  const parsed = commitmentFormSchema.safeParse(commitmentFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext("/commitments/new");

  try {
    const commitment = await createTenantCommitment(
      context,
      {
        ...commitmentMutationPayload(parsed.data),
        status: "OPEN",
      },
    );

    revalidateCommitmentContext(commitment);

    return {
      redirectTo: `/commitments/${commitment.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateCommitmentAction(
  commitmentId: string,
  formData: FormData,
): Promise<CommitmentsActionState> {
  const parsed = commitmentFormSchema.safeParse(commitmentFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(
    `/commitments/${commitmentId}/edit`,
  );

  try {
    const commitment = await updateTenantCommitment(
      context,
      commitmentId,
      commitmentMutationPayload(parsed.data),
    );

    revalidateCommitmentContext(commitment);

    return {
      redirectTo: `/commitments/${commitment.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function fulfillCommitmentAction(
  commitmentId: string,
): Promise<CommitmentsActionState> {
  const context = await requireActionContext(`/commitments/${commitmentId}`);

  try {
    const commitment = await fulfillTenantCommitment(context, commitmentId);

    revalidateCommitmentContext(commitment);

    return {
      redirectTo: `/commitments/${commitment.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function cancelCommitmentAction(
  commitmentId: string,
): Promise<CommitmentsActionState> {
  const context = await requireActionContext(`/commitments/${commitmentId}`);

  try {
    const commitment = await cancelTenantCommitment(context, commitmentId);

    revalidateCommitmentContext(commitment);

    return {
      redirectTo: `/commitments/${commitment.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archiveCommitmentAction(
  commitmentId: string,
): Promise<CommitmentsActionState> {
  const context = await requireActionContext(`/commitments/${commitmentId}`);

  try {
    const commitment = await archiveTenantCommitment(context, commitmentId);

    revalidateCommitmentContext(commitment);

    return {
      redirectTo: "/commitments",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}
