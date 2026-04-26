export type SettingsActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  redirectTo?: string;
  status: "idle" | "error" | "success";
};

export const initialSettingsActionState = {
  status: "idle",
} satisfies SettingsActionState;
