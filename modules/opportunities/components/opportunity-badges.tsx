import type {
  CapabilityStatus,
  CapabilityType,
  IntroductionSuggestionStatus,
  NeedStatus,
  NeedType,
  Sensitivity,
  TaskPriority,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  capabilityStatusLabel,
  capabilityTypeLabel,
  confidenceLabel,
  introductionStatusLabel,
  needStatusLabel,
  needTypeLabel,
  priorityLabel,
  sensitivityLabel,
} from "@/modules/opportunities/labels";

function statusVariant(
  status: NeedStatus | CapabilityStatus | IntroductionSuggestionStatus,
) {
  if (
    status === "OPEN" ||
    status === "ACTIVE" ||
    status === "IN_PROGRESS" ||
    status === "PROPOSED" ||
    status === "ACCEPTED" ||
    status === "OPT_IN_REQUESTED" ||
    status === "INTRO_SENT"
  ) {
    return "default" as const;
  }

  if (
    status === "ADDRESSED" ||
    status === "CLOSED" ||
    status === "RETIRED" ||
    status === "COMPLETED"
  ) {
    return "success" as const;
  }

  if (status === "ARCHIVED" || status === "REJECTED") {
    return "sensitive" as const;
  }

  return "secondary" as const;
}

function priorityVariant(priority: TaskPriority) {
  if (priority === "CRITICAL") {
    return "sensitive" as const;
  }

  if (priority === "HIGH") {
    return "warning" as const;
  }

  return "secondary" as const;
}

export function NeedBadges({
  confidence,
  needType,
  priority,
  sensitivity,
  status,
}: {
  confidence: number | null;
  needType: NeedType;
  priority: TaskPriority;
  sensitivity: Sensitivity;
  status: NeedStatus;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={statusVariant(status)}>{needStatusLabel(status)}</Badge>
      <Badge variant="outline">{needTypeLabel(needType)}</Badge>
      <Badge variant={priorityVariant(priority)}>
        {priorityLabel(priority)}
      </Badge>
      <Badge variant={sensitivity === "NORMAL" ? "outline" : "sensitive"}>
        {sensitivityLabel(sensitivity)}
      </Badge>
      <Badge variant="outline">{confidenceLabel(confidence)}</Badge>
    </div>
  );
}

export function CapabilityBadges({
  capabilityType,
  confidence,
  sensitivity,
  status,
}: {
  capabilityType: CapabilityType;
  confidence: number | null;
  sensitivity: Sensitivity;
  status: CapabilityStatus;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={statusVariant(status)}>
        {capabilityStatusLabel(status)}
      </Badge>
      <Badge variant="outline">{capabilityTypeLabel(capabilityType)}</Badge>
      <Badge variant={sensitivity === "NORMAL" ? "outline" : "sensitive"}>
        {sensitivityLabel(sensitivity)}
      </Badge>
      <Badge variant="outline">{confidenceLabel(confidence)}</Badge>
    </div>
  );
}

export function IntroductionBadges({
  confidence,
  status,
}: {
  confidence: number | null;
  status: IntroductionSuggestionStatus;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={statusVariant(status)}>
        {introductionStatusLabel(status)}
      </Badge>
      <Badge variant="outline">{confidenceLabel(confidence)}</Badge>
    </div>
  );
}
