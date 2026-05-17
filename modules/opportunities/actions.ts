"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { OpportunitiesActionState } from "@/modules/opportunities/action-state";
import {
  capabilityFormSchema,
  formDataValue,
  needFormSchema,
  toFieldErrors,
  type CapabilityFormValues,
  type NeedFormValues,
} from "@/modules/opportunities/validation";
import {
  archiveTenantCapability,
  createTenantCapability,
  updateTenantCapability,
} from "@/server/services/capabilities";
import {
  archiveTenantNeed,
  createTenantNeed,
  updateTenantNeed,
} from "@/server/services/needs";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { getCurrentUserContext } from "@/server/services/session";

async function requireActionContext(callbackUrl: string) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return context;
}

function needFormData(formData: FormData) {
  return {
    companyId: formDataValue(formData, "companyId"),
    confidence: formDataValue(formData, "confidence"),
    description: formDataValue(formData, "description"),
    meetingId: formDataValue(formData, "meetingId"),
    needType: formDataValue(formData, "needType"),
    noteId: formDataValue(formData, "noteId"),
    personId: formDataValue(formData, "personId"),
    priority: formDataValue(formData, "priority"),
    reviewAfter: formDataValue(formData, "reviewAfter"),
    sensitivity: formDataValue(formData, "sensitivity"),
    status: formDataValue(formData, "status"),
    title: formDataValue(formData, "title"),
  };
}

function capabilityFormData(formData: FormData) {
  return {
    capabilityType: formDataValue(formData, "capabilityType"),
    companyId: formDataValue(formData, "companyId"),
    confidence: formDataValue(formData, "confidence"),
    description: formDataValue(formData, "description"),
    noteId: formDataValue(formData, "noteId"),
    personId: formDataValue(formData, "personId"),
    sensitivity: formDataValue(formData, "sensitivity"),
    status: formDataValue(formData, "status"),
    title: formDataValue(formData, "title"),
  };
}

function needMutationPayload(data: NeedFormValues) {
  return {
    companyId: data.companyId,
    confidence: data.confidence,
    description: data.description,
    meetingId: data.meetingId,
    needType: data.needType,
    noteId: data.noteId,
    personId: data.personId,
    priority: data.priority,
    reviewAfter: inputDateOnly(data.reviewAfter),
    sensitivity: data.sensitivity,
    status: data.status,
    title: data.title,
  };
}

function inputDateOnly(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function capabilityMutationPayload(data: CapabilityFormValues) {
  return {
    capabilityType: data.capabilityType,
    companyId: data.companyId,
    confidence: data.confidence,
    description: data.description,
    noteId: data.noteId,
    personId: data.personId,
    sensitivity: data.sensitivity,
    status: data.status,
    title: data.title,
  };
}

function revalidateNeedContext(record: {
  companyId: string | null;
  id: string;
  meetingId: string | null;
  noteId: string | null;
  personId: string | null;
}) {
  revalidatePath("/opportunities");
  revalidatePath("/opportunities/needs");
  revalidatePath(`/opportunities/needs/${record.id}`);

  if (record.personId) {
    revalidatePath(`/people/${record.personId}`);
  }

  if (record.companyId) {
    revalidatePath(`/people/companies/${record.companyId}`);
  }

  if (record.meetingId) {
    revalidatePath(`/meetings/${record.meetingId}`);
  }

  if (record.noteId) {
    revalidatePath(`/notes/${record.noteId}`);
  }
}

function revalidateCapabilityContext(record: {
  companyId: string | null;
  id: string;
  noteId: string | null;
  personId: string | null;
}) {
  revalidatePath("/opportunities");
  revalidatePath("/opportunities/capabilities");
  revalidatePath(`/opportunities/capabilities/${record.id}`);

  if (record.personId) {
    revalidatePath(`/people/${record.personId}`);
  }

  if (record.companyId) {
    revalidatePath(`/people/companies/${record.companyId}`);
  }

  if (record.noteId) {
    revalidatePath(`/notes/${record.noteId}`);
  }
}

function mutationError(error: unknown): OpportunitiesActionState {
  if (error instanceof TenantScopedEntityNotFoundError) {
    return {
      message: "That linked record was not found in this workspace.",
      status: "error",
    };
  }

  return {
    message: "The opportunity record could not be saved. Please try again.",
    status: "error",
  };
}

export async function createNeedAction(
  formData: FormData,
): Promise<OpportunitiesActionState> {
  const parsed = needFormSchema.safeParse(needFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext("/opportunities/needs/new");

  try {
    const need = await createTenantNeed(context, needMutationPayload(parsed.data));

    revalidateNeedContext(need);

    return {
      redirectTo: `/opportunities/needs/${need.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateNeedAction(
  needId: string,
  formData: FormData,
): Promise<OpportunitiesActionState> {
  const parsed = needFormSchema.safeParse(needFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/opportunities/needs/${needId}/edit`);

  try {
    const need = await updateTenantNeed(
      context,
      needId,
      needMutationPayload(parsed.data),
    );

    revalidateNeedContext(need);

    return {
      redirectTo: `/opportunities/needs/${need.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archiveNeedAction(
  needId: string,
): Promise<OpportunitiesActionState> {
  const context = await requireActionContext(`/opportunities/needs/${needId}`);

  try {
    const need = await archiveTenantNeed(context, needId);

    revalidateNeedContext(need);

    return {
      redirectTo: "/opportunities/needs",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function createCapabilityAction(
  formData: FormData,
): Promise<OpportunitiesActionState> {
  const parsed = capabilityFormSchema.safeParse(capabilityFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext("/opportunities/capabilities/new");

  try {
    const capability = await createTenantCapability(
      context,
      capabilityMutationPayload(parsed.data),
    );

    revalidateCapabilityContext(capability);

    return {
      redirectTo: `/opportunities/capabilities/${capability.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateCapabilityAction(
  capabilityId: string,
  formData: FormData,
): Promise<OpportunitiesActionState> {
  const parsed = capabilityFormSchema.safeParse(capabilityFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(
    `/opportunities/capabilities/${capabilityId}/edit`,
  );

  try {
    const capability = await updateTenantCapability(
      context,
      capabilityId,
      capabilityMutationPayload(parsed.data),
    );

    revalidateCapabilityContext(capability);

    return {
      redirectTo: `/opportunities/capabilities/${capability.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archiveCapabilityAction(
  capabilityId: string,
): Promise<OpportunitiesActionState> {
  const context = await requireActionContext(
    `/opportunities/capabilities/${capabilityId}`,
  );

  try {
    const capability = await archiveTenantCapability(context, capabilityId);

    revalidateCapabilityContext(capability);

    return {
      redirectTo: "/opportunities/capabilities",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}
