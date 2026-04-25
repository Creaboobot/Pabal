import Link from "next/link";
import type {
  AIProposalActionType,
  AIProposalItemStatus,
  SourceEntityType,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import type { ProposalsActionState } from "@/modules/proposals/action-state";
import {
  ConfidenceBadge,
  ProposalActionTypeBadge,
  ProposalItemStatusBadge,
} from "@/modules/proposals/components/proposal-badges";
import { ProposalActionButton } from "@/modules/proposals/components/proposal-action-button";
import { ProposedPatchPreview } from "@/modules/proposals/components/proposed-patch-preview";
import { sourceEntityTypeLabel } from "@/modules/proposals/labels";

export type ProposalItemTargetContext = {
  available: boolean;
  entityId: string;
  entityType: SourceEntityType;
  href: string | null;
  label: string;
} | null;

export type ProposalItemCardItem = {
  actionType: AIProposalActionType;
  confidence: number | null;
  explanation: string | null;
  id: string;
  proposedPatch: unknown;
  status: AIProposalItemStatus;
  targetEntityId: string | null;
  targetEntityType: SourceEntityType | null;
};

type ProposalItemCardProps = {
  approveAction: () => Promise<ProposalsActionState>;
  clarifyAction: () => Promise<ProposalsActionState>;
  item: ProposalItemCardItem;
  rejectAction: () => Promise<ProposalsActionState>;
  targetContext: ProposalItemTargetContext;
};

function canReview(status: AIProposalItemStatus) {
  return status === "PENDING_REVIEW" || status === "NEEDS_CLARIFICATION";
}

export function ProposalItemCard({
  approveAction,
  clarifyAction,
  item,
  rejectAction,
  targetContext,
}: ProposalItemCardProps) {
  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            <ProposalItemStatusBadge status={item.status} />
            <ProposalActionTypeBadge actionType={item.actionType} />
            <ConfidenceBadge confidence={item.confidence} />
          </div>

          {targetContext ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant={targetContext.available ? "outline" : "secondary"}>
                {sourceEntityTypeLabel(targetContext.entityType)}
              </Badge>
              {targetContext.href ? (
                <Link
                  className="rounded-sm text-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  href={targetContext.href}
                >
                  {targetContext.label}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {targetContext.label}
                </span>
              )}
            </div>
          ) : (
            <Badge className="w-fit" variant="secondary">
              No target record
            </Badge>
          )}
        </div>

        {item.explanation ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {item.explanation}
          </p>
        ) : null}

        <ProposedPatchPreview proposedPatch={item.proposedPatch} />

        {canReview(item.status) ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <ProposalActionButton
              action={approveAction}
              confirmLabel="Approve item"
              description="This marks the item conceptually accepted. It will not change the target record."
              label="Approve"
              pendingLabel="Approving"
              title="Approve this proposal item?"
            />
            <ProposalActionButton
              action={rejectAction}
              confirmLabel="Reject item"
              description="This marks the proposal item rejected. It will not change the target record."
              label="Reject"
              pendingLabel="Rejecting"
              title="Reject this proposal item?"
              variant="outline"
            />
            <ProposalActionButton
              action={clarifyAction}
              confirmLabel="Mark unclear"
              description="This keeps the proposal in review and flags that user clarification is needed."
              label="Needs clarification"
              pendingLabel="Saving"
              title="Mark this item as needing clarification?"
              variant="ghost"
            />
          </div>
        ) : (
          <p className="rounded-md border border-border bg-muted p-3 text-sm leading-6 text-muted-foreground">
            This review status is stored only. No target record has been
            changed.
          </p>
        )}
      </div>
    </article>
  );
}
