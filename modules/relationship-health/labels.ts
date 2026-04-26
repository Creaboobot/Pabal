import type {
  RelationshipHealthSignal,
  WhyNowSeverity,
} from "@/server/services/relationship-health";

export function relationshipHealthSignalLabel(
  signal: RelationshipHealthSignal,
) {
  switch (signal) {
    case "ACTIVE":
      return "Active";
    case "DORMANT":
      return "Dormant";
    case "NEEDS_ATTENTION":
      return "Needs attention";
    case "STALE":
      return "Stale";
    case "UNKNOWN":
      return "Unknown";
    case "WARM":
      return "Warm";
  }
}

export function relationshipHealthSignalVariant(
  signal: RelationshipHealthSignal,
) {
  switch (signal) {
    case "NEEDS_ATTENTION":
    case "DORMANT":
      return "warning";
    case "ACTIVE":
      return "success";
    case "STALE":
      return "warning";
    case "UNKNOWN":
    case "WARM":
      return "secondary";
  }
}

export function whyNowSeverityLabel(severity: WhyNowSeverity) {
  switch (severity) {
    case "CRITICAL":
      return "Critical";
    case "HIGH":
      return "High";
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
  }
}

export function whyNowSeverityVariant(severity: WhyNowSeverity) {
  switch (severity) {
    case "CRITICAL":
    case "HIGH":
      return "warning";
    case "LOW":
      return "outline";
    case "MEDIUM":
      return "secondary";
  }
}

export function formatRelationshipDate(value: Date | null | undefined) {
  if (!value) {
    return "No interaction yet";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}
