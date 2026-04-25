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

const nullableDate = (label: string) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  },
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `Enter a valid ${label}`)
    .nullable());

const affiliationFields = {
  affiliationTitle: nullableText("Title", 120),
  department: nullableText("Department", 120),
  endsAt: nullableDate("end date"),
  isPrimary: z.boolean(),
  startsAt: nullableDate("start date"),
};

function validateAffiliationDates(
  data: {
    endsAt: string | null;
    isPrimary: boolean;
    startsAt: string | null;
  },
  context: z.RefinementCtx,
) {
  if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must not be before start date",
      path: ["endsAt"],
    });
  }

  if (data.endsAt && data.isPrimary) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ended affiliations cannot be primary",
      path: ["isPrimary"],
    });
  }
}

export const personAffiliationFormSchema = z
  .object({
    ...affiliationFields,
    companyId: requiredText("Company", 128),
  })
  .superRefine(validateAffiliationDates);

export const companyAffiliationFormSchema = z
  .object({
    ...affiliationFields,
    personId: requiredText("Person", 128),
  })
  .superRefine(validateAffiliationDates);

export const editAffiliationFormSchema = z
  .object({
    ...affiliationFields,
    companyId: requiredText("Company", 128),
  })
  .superRefine(validateAffiliationDates);

export type PersonFormValues = z.infer<typeof personFormSchema>;
export type CompanyFormValues = z.infer<typeof companyFormSchema>;
export type PersonAffiliationFormValues = z.infer<
  typeof personAffiliationFormSchema
>;
export type CompanyAffiliationFormValues = z.infer<
  typeof companyAffiliationFormSchema
>;
export type EditAffiliationFormValues = z.infer<
  typeof editAffiliationFormSchema
>;

export function formDataValue(formData: FormData, key: string) {
  return formData.get(key);
}

export function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
