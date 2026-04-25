import type {
  AIProposalActionType,
  AIProposalItemStatus,
  AIProposalStatus,
  AIProposalType,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  confidenceLabel,
  proposalActionTypeLabel,
  proposalItemStatusLabel,
  proposalItemStatusVariant,
  proposalStatusLabel,
  proposalStatusVariant,
  proposalTypeLabel,
} from "@/modules/proposals/labels";

export function ProposalStatusBadge({ status }: { status: AIProposalStatus }) {
  return (
    <Badge variant={proposalStatusVariant(status)}>
      {proposalStatusLabel(status)}
    </Badge>
  );
}

export function ProposalItemStatusBadge({
  status,
}: {
  status: AIProposalItemStatus;
}) {
  return (
    <Badge variant={proposalItemStatusVariant(status)}>
      {proposalItemStatusLabel(status)}
    </Badge>
  );
}

export function ProposalTypeBadge({
  proposalType,
}: {
  proposalType: AIProposalType;
}) {
  return <Badge variant="outline">{proposalTypeLabel(proposalType)}</Badge>;
}

export function ProposalActionTypeBadge({
  actionType,
}: {
  actionType: AIProposalActionType;
}) {
  return <Badge variant="secondary">{proposalActionTypeLabel(actionType)}</Badge>;
}

export function ConfidenceBadge({
  confidence,
}: {
  confidence: number | null | undefined;
}) {
  return <Badge variant="outline">{confidenceLabel(confidence)}</Badge>;
}
