import { z, type ZodError } from "zod";

export function formDataValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

export const workspaceNameFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter a workspace name.")
    .max(120, "Workspace name must be 120 characters or fewer."),
});

export const membershipRoleFormSchema = z.object({
  roleKey: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

export function toFieldErrors(error: ZodError) {
  return error.flatten().fieldErrors;
}
