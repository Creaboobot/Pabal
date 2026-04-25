import { z } from "zod";

import {
  editableMeetingParticipantRoles,
  editableRecordSourceTypes,
} from "@/modules/meetings/labels";

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

const nullableEmail = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}, z.string().email("Enter a valid email address").max(254).nullable());

const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

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

export const meetingFormSchema = z
  .object({
    endedAt: nullableDateTime("End time"),
    location: nullableText("Location", 200),
    occurredAt: requiredDateTime("Start time"),
    primaryCompanyId: nullableText("Primary company", 128),
    sourceType: z.enum(editableRecordSourceTypes),
    summary: nullableText("Summary", 2000),
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

export const meetingParticipantFormSchema = z
  .object({
    companyId: nullableText("Company", 128),
    emailSnapshot: nullableEmail,
    nameSnapshot: nullableText("Name", 160),
    participantRole: z.enum(editableMeetingParticipantRoles),
    personId: nullableText("Person", 128),
  })
  .superRefine((data, context) => {
    if (!data.personId && !data.nameSnapshot && !data.emailSnapshot) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a known person or enter a name or email",
        path: ["personId"],
      });
    }
  });

export type MeetingFormValues = z.infer<typeof meetingFormSchema>;
export type MeetingParticipantFormValues = z.infer<
  typeof meetingParticipantFormSchema
>;

export function formDataValue(formData: FormData, key: string) {
  return formData.get(key);
}

export function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
