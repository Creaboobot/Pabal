import { z } from "zod";

import {
  editableRelationshipStatuses,
  editableRelationshipTemperatures,
} from "@/modules/people/labels";

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

const nullableUrl = (label: string) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }, z.string().url(`Enter a valid ${label} URL`).max(2048).nullable());

export const personFormSchema = z.object({
  displayName: requiredText("Display name", 160),
  firstName: nullableText("First name", 80),
  lastName: nullableText("Last name", 80),
  email: nullableEmail,
  phone: nullableText("Phone", 64),
  jobTitle: nullableText("Title or role", 120),
  relationshipStatus: z.enum(editableRelationshipStatuses),
  relationshipTemperature: z.enum(editableRelationshipTemperatures),
});

export const companyFormSchema = z.object({
  name: requiredText("Company name", 180),
  website: nullableUrl("website"),
  industry: nullableText("Industry", 120),
  description: nullableText("Description", 1000),
});

export type PersonFormValues = z.infer<typeof personFormSchema>;
export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export function formDataValue(
  formData: FormData,
  key: keyof PersonFormValues | keyof CompanyFormValues,
) {
  return formData.get(key);
}

export function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
