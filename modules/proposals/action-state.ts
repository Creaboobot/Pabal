export type ProposalsActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  redirectTo?: string;
  status: "error" | "idle" | "success";
};

export const initialProposalsActionState: ProposalsActionState = {
  status: "idle",
};
