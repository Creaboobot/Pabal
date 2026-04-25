export type NotesActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  redirectTo?: string;
  status: "idle" | "success" | "error";
};

export const initialNotesActionState: NotesActionState = {
  status: "idle",
};
