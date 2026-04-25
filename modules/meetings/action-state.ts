export type MeetingActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  redirectTo?: string;
  status: "idle" | "error" | "success";
};

export const initialMeetingActionState = {
  status: "idle",
} satisfies MeetingActionState;
