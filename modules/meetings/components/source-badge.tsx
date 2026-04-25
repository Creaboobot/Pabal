import type { RecordSourceType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { recordSourceTypeLabel } from "@/modules/meetings/labels";

type SourceBadgeProps = {
  sourceType: RecordSourceType;
};

export function SourceBadge({ sourceType }: SourceBadgeProps) {
  return (
    <Badge variant={sourceType === "MANUAL" ? "secondary" : "outline"}>
      {recordSourceTypeLabel(sourceType)}
    </Badge>
  );
}
