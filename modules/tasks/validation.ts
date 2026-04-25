import { z } from "zod";

import {
  editableTaskPriorities,
  editableTaskStatuses,
  editableTaskTypes,
} from "@/modules/tasks/labels";

const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

const requiredText = (label: string, max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().min(1, `${label} is required`).max(max),
  );

const nullableText = (label: string, max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }, z.string().max(max, `${label} is too long`).nullable());

const nullableId = (label: string) => nullableText(label, 128);

const nullableDateTime = (label: string) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  },
  z
    .string()
    .regex(dateTimePattern, `Enter a valid ${label.toLowerCase()}`)
    .nullable());

const taskStatus = z.preprocess(
  (value) => (typeof value === "string" && value.length > 0 ? value : "OPEN"),
  z.enum(editableTaskStatuses),
);

export const taskFormSchema = z
  .object({
    commitmentId: nullableId("Commitment"),
    companyId: nullableId("Company"),
    description: nullableText("Description", 4000),
    dueAt: nullableDateTime("Due date"),
    introductionSuggestionId: nullableId("Introduction suggestion"),
    meetingId: nullableId("Meeting"),
    noteId: nullableId("Note"),
    personId: nullableId("Person"),
    priority: z.enum(editableTaskPriorities),
    reminderAt: nullableDateTime("Reminder date"),
    snoozedUntil: nullableDateTime("Snooze date"),
    status: taskStatus,
    taskType: z.enum(editableTaskTypes),
    title: requiredText("Task title", 180),
    whyNowRationale: nullableText("Why now rationale", 2000),
  })
  .superRefine((data, context) => {
    if (
      data.dueAt &&
      data.reminderAt &&
      new Date(data.reminderAt) > new Date(data.dueAt)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reminder date should not be after the due date",
        path: ["reminderAt"],
      });
    }
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export function formDataValue(formData: FormData, key: string) {
  return formData.get(key);
}

export function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
