"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ProposalsActionState } from "@/modules/proposals/action-state";
import {
  proposalIdSchema,
  proposalItemReviewSchema,
  toFieldErrors,
} from "@/modules/proposals/validation";
import { getCurrentUserContext } from "@/server/services/session";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  dismissTenantAIProposal,
  reviewAllPendingTenantAIProposalItems,
  reviewTenantAIProposalItem,
} from "@/server/services/ai-proposals";

async function requireActionContext(callbackUrl: string) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return context;
}

function proposalItemPayload(proposalId: string, proposalItemId: string) {
  return {
    proposalId,
    proposalItemId,
  };
}

function revalidateProposal(proposalId: string) {
  revalidatePath("/today");
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
}

function mutationError(error: unknown): ProposalsActionState {
  if (error instanceof TenantScopedEntityNotFoundError) {
    return {
      message: "That proposal was not found in this workspace.",
      status: "error",
    };
  }

  return {
    message: "The proposal could not be updated. Please try again.",
    status: "error",
  };
}

export async function approveProposalItemAction(
  proposalId: string,
  proposalItemId: string,
): Promise<ProposalsActionState> {
  const parsed = proposalItemReviewSchema.safeParse(
    proposalItemPayload(proposalId, proposalItemId),
  );

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/proposals/${proposalId}`);

  try {
    await reviewTenantAIProposalItem(context, {
      aiProposalId: parsed.data.proposalId,
      aiProposalItemId: parsed.data.proposalItemId,
      nextStatus: "APPROVED",
    });
    revalidateProposal(parsed.data.proposalId);

    return { status: "success" };
  } catch (error) {
    return mutationError(error);
  }
}

export async function rejectProposalItemAction(
  proposalId: string,
  proposalItemId: string,
): Promise<ProposalsActionState> {
  const parsed = proposalItemReviewSchema.safeParse(
    proposalItemPayload(proposalId, proposalItemId),
  );

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/proposals/${proposalId}`);

  try {
    await reviewTenantAIProposalItem(context, {
      aiProposalId: parsed.data.proposalId,
      aiProposalItemId: parsed.data.proposalItemId,
      nextStatus: "REJECTED",
    });
    revalidateProposal(parsed.data.proposalId);

    return { status: "success" };
  } catch (error) {
    return mutationError(error);
  }
}

export async function clarifyProposalItemAction(
  proposalId: string,
  proposalItemId: string,
): Promise<ProposalsActionState> {
  const parsed = proposalItemReviewSchema.safeParse(
    proposalItemPayload(proposalId, proposalItemId),
  );

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/proposals/${proposalId}`);

  try {
    await reviewTenantAIProposalItem(context, {
      aiProposalId: parsed.data.proposalId,
      aiProposalItemId: parsed.data.proposalItemId,
      nextStatus: "NEEDS_CLARIFICATION",
    });
    revalidateProposal(parsed.data.proposalId);

    return { status: "success" };
  } catch (error) {
    return mutationError(error);
  }
}

export async function approveAllPendingProposalItemsAction(
  proposalId: string,
): Promise<ProposalsActionState> {
  const parsed = proposalIdSchema.safeParse({ proposalId });

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/proposals/${proposalId}`);

  try {
    await reviewAllPendingTenantAIProposalItems(context, {
      aiProposalId: parsed.data.proposalId,
      nextStatus: "APPROVED",
    });
    revalidateProposal(parsed.data.proposalId);

    return { status: "success" };
  } catch (error) {
    return mutationError(error);
  }
}

export async function rejectAllPendingProposalItemsAction(
  proposalId: string,
): Promise<ProposalsActionState> {
  const parsed = proposalIdSchema.safeParse({ proposalId });

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/proposals/${proposalId}`);

  try {
    await reviewAllPendingTenantAIProposalItems(context, {
      aiProposalId: parsed.data.proposalId,
      nextStatus: "REJECTED",
    });
    revalidateProposal(parsed.data.proposalId);

    return { status: "success" };
  } catch (error) {
    return mutationError(error);
  }
}

export async function dismissProposalAction(
  proposalId: string,
): Promise<ProposalsActionState> {
  const parsed = proposalIdSchema.safeParse({ proposalId });

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/proposals/${proposalId}`);

  try {
    await dismissTenantAIProposal(context, parsed.data.proposalId);
    revalidateProposal(parsed.data.proposalId);

    return {
      redirectTo: "/proposals",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}
