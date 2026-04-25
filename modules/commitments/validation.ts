import { z } from "zod";

import {
  editableCommitmentOwnerTypes,
  editableCommitmentSensitivities,
  editableCommitmentStatuses,
} from "@/modules/commitments/labels";

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

const commitmentStatus = z.preprocess(
  (value) => (typeof value === "string" && value.length > 0 ? value : "OPEN"),
  z.enum(editableCommitmentStatuses),
);

export const commitmentFormSchema = z
  .object({
    counterpartyCompanyId: nullableId("Counterparty company"),
    counterpartyPersonId: nullableId("Counterparty person"),
    description: nullableText("Description", 4000),
    dueAt: nullableDateTime("Due date"),
    dueWindowEnd: nullableDateTime("Due window end"),
    dueWindowStart: nullableDateTime("Due window start"),
    meetingId: nullableId("Meeting"),
    noteId: nullableId("Note"),
    ownerCompanyId: nullableId("Owner company"),
    ownerPersonId: nullableId("Owner person"),
    ownerType: z.enum(editableCommitmentOwnerTypes),
    sensitivity: z.enum(editableCommitmentSensitivities),
    status: commitmentStatus,
    title: requiredText("Commitment title", 180),
  })
  .superRefine((data, context) => {
    if (
      data.dueWindowStart &&
      data.dueWindowEnd &&
      new Date(data.dueWindowEnd) < new Date(data.dueWindowStart)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Due window end must not be before the start",
        path: ["dueWindowEnd"],
      });
    }

    if (
      (data.ownerType === "ME" || data.ownerType === "UNKNOWN") &&
      (data.ownerPersonId || data.ownerCompanyId)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.ownerType} commitments cannot include owner records`,
        path: ["ownerType"],
      });
    }

    if (data.ownerType === "OTHER_PERSON" && !data.ownerPersonId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose the owner person",
        path: ["ownerPersonId"],
      });
    }

    if (data.ownerType === "COMPANY" && !data.ownerCompanyId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose the owner company",
        path: ["ownerCompanyId"],
      });
    }
  });

export type CommitmentFormValues = z.infer<typeof commitmentFormSchema>;

export function formDataValue(formData: FormData, key: string) {
  return formData.get(key);
}

export function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
