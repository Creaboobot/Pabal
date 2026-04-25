export type PeopleActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  redirectTo?: string;
  status: "idle" | "error" | "success";
};

export const initialPeopleActionState = {
  status: "idle",
} satisfies PeopleActionState;
