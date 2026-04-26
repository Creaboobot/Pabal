export type VoiceNotesActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  redirectTo?: string;
  status: "idle" | "error" | "success";
};

export const initialVoiceNotesActionState: VoiceNotesActionState = {
  status: "idle",
};
