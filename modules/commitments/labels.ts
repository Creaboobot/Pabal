import type {
  CommitmentOwnerType,
  CommitmentStatus,
  Sensitivity,
} from "@prisma/client";

export const editableCommitmentOwnerTypes = [
  "ME",
  "OTHER_PERSON",
  "COMPANY",
  "UNKNOWN",
] as const satisfies readonly CommitmentOwnerType[];

export const editableCommitmentStatuses = [
  "OPEN",
  "WAITING",
  "DONE",
  "CANCELLED",
] as const satisfies readonly CommitmentStatus[];

export const commitmentFormStatuses = [
  "OPEN",
  "WAITING",
] as const satisfies readonly CommitmentStatus[];

export const editableCommitmentSensitivities = [
  "NORMAL",
  "SENSITIVE_BUSINESS",
  "PERSONAL",
  "CONFIDENTIAL",
  "DO_NOT_USE_IN_OUTREACH",
  "DO_NOT_SHARE",
] as const satisfies readonly Sensitivity[];

export function commitmentOwnerTypeLabel(ownerType: CommitmentOwnerType) {
  switch (ownerType) {
    case "ME":
      return "Me";
    case "OTHER_PERSON":
      return "Other person";
    case "COMPANY":
      return "Company";
    case "UNKNOWN":
      return "Unknown";
  }
}

export function commitmentStatusLabel(status: CommitmentStatus) {
  switch (status) {
    case "OPEN":
      return "Open";
    case "WAITING":
      return "Waiting";
    case "DONE":
      return "Fulfilled";
    case "CANCELLED":
      return "Cancelled";
    case "OVERDUE":
      return "Overdue";
  }
}

export function sensitivityLabel(sensitivity: Sensitivity) {
  switch (sensitivity) {
    case "NORMAL":
      return "Normal";
    case "SENSITIVE_BUSINESS":
      return "Sensitive business";
    case "PERSONAL":
      return "Personal";
    case "CONFIDENTIAL":
      return "Confidential";
    case "DO_NOT_USE_IN_OUTREACH":
      return "Do not use in outreach";
    case "DO_NOT_SHARE":
      return "Do not share";
  }
}

export function formatDateTimeLocal(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

export function formatCommitmentDateTime(value: Date | null | undefined) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function commitmentDueBoundary(commitment: {
  dueAt: Date | null;
  dueWindowEnd: Date | null;
  dueWindowStart: Date | null;
}) {
  return commitment.dueAt ?? commitment.dueWindowEnd ?? commitment.dueWindowStart;
}

export function isOverdueCommitment(commitment: {
  dueAt: Date | null;
  dueWindowEnd: Date | null;
  dueWindowStart: Date | null;
  status: CommitmentStatus;
}) {
  const due = commitmentDueBoundary(commitment);

  return (
    due !== null &&
    due < new Date() &&
    commitment.status !== "DONE" &&
    commitment.status !== "CANCELLED" &&
    commitment.status !== "WAITING"
  );
}

export function commitmentDueLabel(commitment: {
  dueAt: Date | null;
  dueWindowEnd: Date | null;
  dueWindowStart: Date | null;
}) {
  if (commitment.dueAt) {
    return `Due ${formatCommitmentDateTime(commitment.dueAt)}`;
  }

  if (commitment.dueWindowStart && commitment.dueWindowEnd) {
    return `${formatCommitmentDateTime(
      commitment.dueWindowStart,
    )} to ${formatCommitmentDateTime(commitment.dueWindowEnd)}`;
  }

  if (commitment.dueWindowStart) {
    return `Window starts ${formatCommitmentDateTime(
      commitment.dueWindowStart,
    )}`;
  }

  if (commitment.dueWindowEnd) {
    return `Window ends ${formatCommitmentDateTime(commitment.dueWindowEnd)}`;
  }

  return "No due date";
}
