export type OpportunitiesActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  redirectTo?: string;
  status: "error" | "idle" | "success";
};

export const initialOpportunitiesActionState: OpportunitiesActionState = {
  status: "idle",
};
