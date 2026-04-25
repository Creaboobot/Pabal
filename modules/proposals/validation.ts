import { z } from "zod";

export const proposalIdSchema = z.object({
  proposalId: z.string().trim().min(1, "Proposal id is required."),
});

export const proposalItemReviewSchema = proposalIdSchema.extend({
  proposalItemId: z.string().trim().min(1, "Proposal item id is required."),
});

export function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
