import { z } from "zod";

import {
  editableCapabilityStatuses,
  editableCapabilityTypes,
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

const nullableText = (label: string, max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }, z.string().max(max, `${label} is too long`).nullable());

const nullableId = (label: string) => nullableText(label, 128);

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

export type NeedFormValues = z.infer<typeof needFormSchema>;
export type CapabilityFormValues = z.infer<typeof capabilityFormSchema>;

export function formDataValue(formData: FormData, key: string) {
  return formData.get(key);
}

export function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
