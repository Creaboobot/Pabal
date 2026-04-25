import type {
  CommitmentOwnerType,
  CommitmentStatus,
  Sensitivity,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  commitmentDueLabel,
  commitmentOwnerTypeLabel,
  commitmentStatusLabel,
  isOverdueCommitment,
  sensitivityLabel,
} from "@/modules/commitments/labels";

type CommitmentBadgesProps = {
  dueAt: Date | null;
  dueWindowEnd: Date | null;
  dueWindowStart: Date | null;
  ownerType: CommitmentOwnerType;
  sensitivity: Sensitivity;
  status: CommitmentStatus;
};

export function CommitmentBadges({
  dueAt,
  dueWindowEnd,
  dueWindowStart,
  ownerType,
  sensitivity,
  status,
}: CommitmentBadgesProps) {
  const overdue = isOverdueCommitment({
    dueAt,
    dueWindowEnd,
    dueWindowStart,
    status,
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={overdue ? "warning" : "secondary"}>
        {overdue ? "Overdue" : commitmentStatusLabel(status)}
      </Badge>
      <Badge variant="outline">{commitmentOwnerTypeLabel(ownerType)}</Badge>
      <Badge
        variant={
          sensitivity === "NORMAL" || sensitivity === "PERSONAL"
            ? "outline"
            : "warning"
        }
      >
        {sensitivityLabel(sensitivity)}
      </Badge>
      <Badge variant={overdue ? "warning" : "secondary"}>
        {commitmentDueLabel({ dueAt, dueWindowEnd, dueWindowStart })}
      </Badge>
    </div>
  );
}
