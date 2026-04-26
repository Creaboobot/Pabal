"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { SettingsActionState } from "@/modules/settings/action-state";
import { toFieldErrors } from "@/modules/settings/validation";
import {
  restoreArchiveRecordSchema,
  restoreTenantArchivedRecord,
} from "@/server/services/archive-management";
import { WorkspaceAdminAuthorizationError } from "@/server/services/admin-authorization";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { getCurrentUserContext } from "@/server/services/session";

async function requireActionContext() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings/archive");
  }

  return context;
}

function mutationError(error: unknown): SettingsActionState {
  if (error instanceof WorkspaceAdminAuthorizationError) {
    return {
      message: "Owner or admin access is required to restore archived records.",
      status: "error",
    };
  }

  if (error instanceof TenantScopedEntityNotFoundError) {
    return {
      message: "That archived record was not found in this workspace.",
      status: "error",
    };
  }

  return {
    message: "The archived record could not be restored. Please try again.",
    status: "error",
  };
}

export async function restoreArchivedRecordAction(
  recordType: string,
  recordId: string,
): Promise<SettingsActionState> {
  const parsed = restoreArchiveRecordSchema.safeParse({
    recordId,
    recordType,
  });

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Choose a supported archived record.",
      status: "error",
    };
  }

  const context = await requireActionContext();

  try {
    const restored = await restoreTenantArchivedRecord(context, parsed.data);

    for (const path of restored.affectedPaths) {
      revalidatePath(path);
    }

    return {
      message: "Archived record restored.",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}
