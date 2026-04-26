"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { SettingsActionState } from "@/modules/settings/action-state";
import {
  formDataValue,
  membershipRoleFormSchema,
  toFieldErrors,
  workspaceNameFormSchema,
} from "@/modules/settings/validation";
import {
  WorkspaceAdminValidationError,
  LastWorkspaceOwnerError,
  WorkspaceMemberNotFoundError,
  deactivateTenantMembership,
  reactivateTenantMembership,
  updateTenantMembershipRole,
  updateTenantWorkspaceName,
} from "@/server/services/workspace-admin";
import {
  WorkspaceAdminAuthorizationError,
  WorkspaceOwnerAuthorizationError,
} from "@/server/services/admin-authorization";
import { getCurrentUserContext } from "@/server/services/session";

async function requireActionContext(callbackUrl: string) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return context;
}

function mutationError(error: unknown): SettingsActionState {
  if (
    error instanceof WorkspaceAdminAuthorizationError ||
    error instanceof WorkspaceOwnerAuthorizationError
  ) {
    return {
      message: "You do not have permission to change workspace administration settings.",
      status: "error",
    };
  }

  if (error instanceof LastWorkspaceOwnerError) {
    return {
      message: "The last active workspace owner cannot be demoted or deactivated.",
      status: "error",
    };
  }

  if (error instanceof WorkspaceMemberNotFoundError) {
    return {
      message: "That membership was not found in this workspace.",
      status: "error",
    };
  }

  if (error instanceof WorkspaceAdminValidationError) {
    return {
      message: error.message,
      status: "error",
    };
  }

  return {
    message: "The workspace setting could not be updated. Please try again.",
    status: "error",
  };
}

export async function updateWorkspaceNameAction(
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = workspaceNameFormSchema.safeParse({
    name: formDataValue(formData, "name"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext("/settings/workspace");

  try {
    await updateTenantWorkspaceName(context, parsed.data);

    revalidatePath("/settings");
    revalidatePath("/settings/workspace");

    return {
      message: "Workspace name updated.",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateMembershipRoleAction(
  membershipId: string,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = membershipRoleFormSchema.safeParse({
    roleKey: formDataValue(formData, "roleKey"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Choose a supported role.",
      status: "error",
    };
  }

  const context = await requireActionContext("/settings/members");

  try {
    await updateTenantMembershipRole(context, membershipId, parsed.data.roleKey);

    revalidatePath("/settings");
    revalidatePath("/settings/members");

    return {
      message: "Member role updated.",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function deactivateMembershipAction(
  membershipId: string,
): Promise<SettingsActionState> {
  const context = await requireActionContext("/settings/members");

  try {
    await deactivateTenantMembership(context, membershipId);

    revalidatePath("/settings/members");

    return {
      message: "Membership deactivated.",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function reactivateMembershipAction(
  membershipId: string,
): Promise<SettingsActionState> {
  const context = await requireActionContext("/settings/members");

  try {
    await reactivateTenantMembership(context, membershipId);

    revalidatePath("/settings/members");

    return {
      message: "Membership reactivated.",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}
