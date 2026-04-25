"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { TasksActionState } from "@/modules/tasks/action-state";
import {
  formDataValue,
  type TaskFormValues,
  taskFormSchema,
  toFieldErrors,
} from "@/modules/tasks/validation";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { getCurrentUserContext } from "@/server/services/session";
import {
  archiveTenantTask,
  completeTenantTask,
  createTenantTask,
  reopenTenantTask,
  updateTenantTask,
} from "@/server/services/tasks";

async function requireActionContext(callbackUrl: string) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return context;
}

function taskFormData(formData: FormData) {
  return {
    commitmentId: formDataValue(formData, "commitmentId"),
    companyId: formDataValue(formData, "companyId"),
    description: formDataValue(formData, "description"),
    dueAt: formDataValue(formData, "dueAt"),
    introductionSuggestionId: formDataValue(
      formData,
      "introductionSuggestionId",
    ),
    meetingId: formDataValue(formData, "meetingId"),
    noteId: formDataValue(formData, "noteId"),
    personId: formDataValue(formData, "personId"),
    priority: formDataValue(formData, "priority"),
    reminderAt: formDataValue(formData, "reminderAt"),
    snoozedUntil: formDataValue(formData, "snoozedUntil"),
    status: formDataValue(formData, "status"),
    taskType: formDataValue(formData, "taskType"),
    title: formDataValue(formData, "title"),
    whyNowRationale: formDataValue(formData, "whyNowRationale"),
  };
}

function inputDateTime(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function taskMutationPayload(data: TaskFormValues) {
  return {
    commitmentId: data.commitmentId,
    companyId: data.companyId,
    description: data.description,
    dueAt: inputDateTime(data.dueAt),
    introductionSuggestionId: data.introductionSuggestionId,
    meetingId: data.meetingId,
    noteId: data.noteId,
    personId: data.personId,
    priority: data.priority,
    reminderAt: inputDateTime(data.reminderAt),
    snoozedUntil: inputDateTime(data.snoozedUntil),
    taskType: data.taskType,
    title: data.title,
    whyNowRationale: data.whyNowRationale,
  };
}

function revalidateTaskContext(task: {
  commitmentId: string | null;
  companyId: string | null;
  id: string;
  introductionSuggestionId: string | null;
  meetingId: string | null;
  noteId: string | null;
  personId: string | null;
}) {
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${task.id}`);

  if (task.personId) {
    revalidatePath(`/people/${task.personId}`);
  }

  if (task.companyId) {
    revalidatePath(`/people/companies/${task.companyId}`);
  }

  if (task.meetingId) {
    revalidatePath(`/meetings/${task.meetingId}`);
  }

  if (task.noteId) {
    revalidatePath(`/notes/${task.noteId}`);
  }
}

function mutationError(error: unknown): TasksActionState {
  if (error instanceof TenantScopedEntityNotFoundError) {
    return {
      message: "That record was not found in this workspace.",
      status: "error",
    };
  }

  return {
    message: "The task could not be saved. Please try again.",
    status: "error",
  };
}

export async function createTaskAction(
  formData: FormData,
): Promise<TasksActionState> {
  const parsed = taskFormSchema.safeParse(taskFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext("/tasks/new");

  try {
    const task = await createTenantTask(context, taskMutationPayload(parsed.data));

    revalidateTaskContext(task);

    return {
      redirectTo: `/tasks/${task.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateTaskAction(
  taskId: string,
  formData: FormData,
): Promise<TasksActionState> {
  const parsed = taskFormSchema.safeParse(taskFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/tasks/${taskId}/edit`);

  try {
    const task = await updateTenantTask(
      context,
      taskId,
      taskMutationPayload(parsed.data),
    );

    revalidateTaskContext(task);

    return {
      redirectTo: `/tasks/${task.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function completeTaskAction(
  taskId: string,
): Promise<TasksActionState> {
  const context = await requireActionContext(`/tasks/${taskId}`);

  try {
    const task = await completeTenantTask(context, taskId);

    revalidateTaskContext(task);

    return {
      redirectTo: `/tasks/${task.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function reopenTaskAction(
  taskId: string,
): Promise<TasksActionState> {
  const context = await requireActionContext(`/tasks/${taskId}`);

  try {
    const task = await reopenTenantTask(context, taskId);

    revalidateTaskContext(task);

    return {
      redirectTo: `/tasks/${task.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archiveTaskAction(
  taskId: string,
): Promise<TasksActionState> {
  const context = await requireActionContext(`/tasks/${taskId}`);

  try {
    const task = await archiveTenantTask(context, taskId);

    revalidateTaskContext(task);

    return {
      redirectTo: "/tasks",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}
