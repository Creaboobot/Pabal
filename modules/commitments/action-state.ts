export type CommitmentsActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  redirectTo?: string;
  status: "idle" | "success" | "error";
};

export const initialCommitmentsActionState: CommitmentsActionState = {
  status: "idle",
};
