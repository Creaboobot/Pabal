import type { RelationshipStatus, RelationshipTemperature } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  relationshipStatusLabel,
  relationshipTemperatureLabel,
} from "@/modules/people/labels";

type RelationshipBadgesProps = {
  status: RelationshipStatus;
  temperature: RelationshipTemperature;
};

export function RelationshipBadges({
  status,
  temperature,
}: RelationshipBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={status === "ACTIVE" ? "success" : "outline"}>
        {relationshipStatusLabel(status)}
      </Badge>
      <Badge variant={temperature === "HOT" ? "success" : "secondary"}>
        {relationshipTemperatureLabel(temperature)}
      </Badge>
    </div>
  );
}
