import type { RelationshipStatus, RelationshipTemperature } from "@prisma/client";

export const editableRelationshipStatuses = [
  "UNKNOWN",
  "ACTIVE",
  "DORMANT",
] as const satisfies readonly RelationshipStatus[];

export const editableRelationshipTemperatures = [
  "UNKNOWN",
  "COLD",
  "COOL",
  "NEUTRAL",
  "WARM",
  "HOT",
] as const satisfies readonly RelationshipTemperature[];

export function relationshipStatusLabel(status: RelationshipStatus) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "DORMANT":
      return "Dormant";
    case "ARCHIVED":
      return "Archived";
    case "UNKNOWN":
      return "Unknown";
  }
}

export function relationshipTemperatureLabel(
  temperature: RelationshipTemperature,
) {
  switch (temperature) {
    case "COLD":
      return "Cold";
    case "COOL":
      return "Cool";
    case "NEUTRAL":
      return "Neutral";
    case "WARM":
      return "Warm";
    case "HOT":
      return "Hot";
    case "UNKNOWN":
      return "Unknown";
  }
}
