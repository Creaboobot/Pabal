import type { TaskPriority, TaskStatus, TaskType } from "@prisma/client";

export const editableTaskPriorities = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const satisfies readonly TaskPriority[];

export const editableTaskStatuses = [
  "OPEN",
  "SNOOZED",
  "DONE",
  "CANCELLED",
] as const satisfies readonly TaskStatus[];

export const editableTaskTypes = [
  "FOLLOW_UP",
  "COMMITMENT",
  "INTRODUCTION",
  "MEETING_PREP",
  "RELATIONSHIP_MAINTENANCE",
  "OTHER",
] as const satisfies readonly TaskType[];

export function taskPriorityLabel(priority: TaskPriority) {
  switch (priority) {
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
    case "HIGH":
      return "High";
    case "CRITICAL":
      return "Critical";
  }
}

export function taskStatusLabel(status: TaskStatus) {
  switch (status) {
    case "OPEN":
      return "Open";
    case "SNOOZED":
      return "Snoozed";
    case "DONE":
      return "Done";
    case "CANCELLED":
      return "Cancelled";
  }
}

export function taskTypeLabel(taskType: TaskType) {
  switch (taskType) {
    case "FOLLOW_UP":
      return "Follow-up";
    case "COMMITMENT":
      return "Commitment follow-up";
    case "INTRODUCTION":
      return "Introduction";
    case "MEETING_PREP":
      return "Meeting prep";
    case "RELATIONSHIP_MAINTENANCE":
      return "Relationship maintenance";
    case "OTHER":
      return "Other";
  }
}

export function formatDateTimeLocal(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

export function formatTaskDate(value: Date | null | undefined) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatTaskDateTime(value: Date | null | undefined) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function isOverdueTask(task: {
  dueAt: Date | null;
  status: TaskStatus;
}) {
  return (
    task.dueAt !== null &&
    task.dueAt < new Date() &&
    task.status !== "DONE" &&
    task.status !== "CANCELLED"
  );
}
