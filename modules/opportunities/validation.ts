import { z } from "zod";

import {
  editableCapabilityStatuses,
  editableCapabilityTypes,
  editableIntroductionStatuses,
  editableNeedStatuses,
  editableNeedTypes,
  editablePriorities,
  editableSensitivities,
} from "@/modules/opportunities/labels";

const requiredText = (label: string, max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().min(1, `${label} is required`).max(max),
  );

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

const nullableText = (label: string, max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }, z.string().max(max, `${label} is too long`).nullable());

const nullableId = (label: string) => nullableText(label, 128);

const nullableDateOnly = (label: string) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  },
  z
    .string()
    .regex(dateOnlyPattern, `Enter a valid ${label.toLowerCase()}`)
    .refine(isValidDateOnly, `Enter a valid ${label.toLowerCase()}`)
    .nullable());

const nullableConfidence = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? Number(trimmed) : null;
},
z
  .number()
  .min(0, "Confidence must be at least 0")
  .max(1, "Confidence must be at most 1")
  .nullable());

export const needFormSchema = z.object({
  companyId: nullableId("Company"),
  confidence: nullableConfidence,
  description: nullableText("Description", 4000),
  meetingId: nullableId("Meeting"),
  needType: z.enum(editableNeedTypes),
  noteId: nullableId("Note"),
  personId: nullableId("Person"),
  priority: z.enum(editablePriorities),
  reviewAfter: nullableDateOnly("Review after date"),
  sensitivity: z.enum(editableSensitivities),
  status: z.enum(editableNeedStatuses),
  title: requiredText("Need title", 180),
});

export const capabilityFormSchema = z.object({
  capabilityType: z.enum(editableCapabilityTypes),
  companyId: nullableId("Company"),
  confidence: nullableConfidence,
  description: nullableText("Description", 4000),
  noteId: nullableId("Note"),
  personId: nullableId("Person"),
  sensitivity: z.enum(editableSensitivities),
  status: z.enum(editableCapabilityStatuses),
  title: requiredText("Capability title", 180),
});

export const introductionSuggestionFormSchema = z
  .object({
    capabilityId: nullableId("Capability"),
    confidence: nullableConfidence,
    fromCompanyId: nullableId("From company"),
    fromPersonId: nullableId("From person"),
    needId: nullableId("Need"),
    rationale: requiredText("Rationale", 4000),
    sourceMeetingId: nullableId("Source meeting"),
    sourceNoteId: nullableId("Source note"),
    status: z.enum(editableIntroductionStatuses),
    toCompanyId: nullableId("To company"),
    toPersonId: nullableId("To person"),
  })
  .superRefine((data, context) => {
    if (data.fromPersonId && data.fromPersonId === data.toPersonId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a different person for each side.",
        path: ["toPersonId"],
      });
    }

    const contextAnchors = [
      data.needId,
      data.capabilityId,
      data.fromPersonId,
      data.fromCompanyId,
      data.toPersonId,
      data.toCompanyId,
    ].filter(Boolean);

    if (contextAnchors.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Add at least two linked records so the introduction has enough context.",
        path: ["needId"],
      });
    }
  });

export type NeedFormValues = z.infer<typeof needFormSchema>;
export type CapabilityFormValues = z.infer<typeof capabilityFormSchema>;
export type IntroductionSuggestionFormValues = z.infer<
  typeof introductionSuggestionFormSchema
>;

export function formDataValue(formData: FormData, key: string) {
  return formData.get(key);
}

export function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
