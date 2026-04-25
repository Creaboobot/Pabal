import { z } from "zod";

import { editableRecordSourceTypes } from "@/modules/meetings/labels";
import { editableNoteTypes, editableSensitivityTypes } from "@/modules/notes/labels";

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

const requiredDateTime = (label: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z
      .string()
      .min(1, `${label} is required`)
      .regex(dateTimePattern, `Enter a valid ${label.toLowerCase()}`),
  );

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

export const noteFormSchema = z.object({
  body: requiredText("Note body", 20000),
  companyId: nullableId("Company"),
  meetingId: nullableId("Meeting"),
  noteType: z.enum(editableNoteTypes),
  personId: nullableId("Person"),
  sensitivity: z.enum(editableSensitivityTypes),
  sourceType: z.enum(editableRecordSourceTypes),
  summary: nullableText("Summary", 2000),
});

export const pastedMeetingCaptureFormSchema = z
  .object({
    body: requiredText("Pasted note", 80000),
    endedAt: nullableDateTime("End time"),
    occurredAt: requiredDateTime("Start time"),
    participantPersonIds: z.array(z.string().trim().min(1).max(128)).max(25),
    primaryCompanyId: nullableId("Primary company"),
    sensitivity: z.enum(editableSensitivityTypes),
    summary: nullableText("Manual summary", 2000),
    title: requiredText("Meeting title", 180),
  })
  .superRefine((data, context) => {
    if (data.endedAt && data.endedAt < data.occurredAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must not be before start time",
        path: ["endedAt"],
      });
    }
  });

export type NoteFormValues = z.infer<typeof noteFormSchema>;
export type PastedMeetingCaptureFormValues = z.infer<
  typeof pastedMeetingCaptureFormSchema
>;

export function formDataValue(formData: FormData, key: string) {
  return formData.get(key);
}

export function formDataValues(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => {
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
