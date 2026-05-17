import type { SourceEntityType, TaskPriority } from "@prisma/client";

import {
  getCompanyRelationshipHealthFacts,
  getPersonRelationshipHealthFacts,
  listRelationshipHealthCompanies,
  listRelationshipHealthPeople,
} from "@/server/repositories/relationship-health";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export const ACTIVE_INTERACTION_DAYS = 14;
export const WARM_INTERACTION_DAYS = 45;
export const STALE_AFTER_DAYS = 60;
export const DORMANT_AFTER_DAYS = 120;
export const UPCOMING_DUE_DAYS = 7;
export const TODAY_ATTENTION_LIMIT = 8;
export const DETAIL_REASON_LIMIT = 5;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type RelationshipHealthSignal =
  | "NEEDS_ATTENTION"
  | "ACTIVE"
  | "WARM"
  | "STALE"
  | "DORMANT"
  | "UNKNOWN";

export type WhyNowReasonType =
  | "OVERDUE_TASK"
  | "UPCOMING_TASK"
  | "OPEN_TASK"
  | "OVERDUE_COMMITMENT"
  | "UPCOMING_COMMITMENT"
  | "OPEN_COMMITMENT"
  | "DUE_NEED_REVIEW"
  | "ACTIVE_NEED"
  | "ACTIVE_CAPABILITY"
  | "PENDING_AI_PROPOSAL"
  | "RECENT_MEETING"
  | "RECENT_NOTE"
  | "STALE_RELATIONSHIP"
  | "DORMANT_RELATIONSHIP"
  | "NO_RELATIONSHIP_CONTEXT";

export type WhyNowSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RelationshipEntityType = "PERSON" | "COMPANY";

export type WhyNowReason = {
  date?: Date | null;
  explanation: string;
  href?: string;
  label: string;
  relatedEntityId: string;
  relatedEntityType: SourceEntityType;
  severity: WhyNowSeverity;
  type: WhyNowReasonType;
};

export type RelationshipHealthCounts = {
  activeCapabilities: number;
  activeIntroductions: number;
  activeNeeds: number;
  openCommitments: number;
  openTasks: number;
  pendingProposals: number;
};

export type RelationshipHealth = {
  counts: RelationshipHealthCounts;
  entityId: string;
  entityLabel: string;
  entityType: RelationshipEntityType;
  explanation: string;
  lastInteractionAt: Date | null;
  reasonCount: number;
  reasons: WhyNowReason[];
  signal: RelationshipHealthSignal;
};

type TaskFact = {
  dueAt: Date | null;
  id: string;
  priority: TaskPriority;
  title: string;
};

type CommitmentFact = {
  dueAt: Date | null;
  dueWindowEnd: Date | null;
  dueWindowStart: Date | null;
  id: string;
  status: string;
  title: string;
};

type InteractionFact = {
  createdAt: Date;
  id: string;
  occurredAt?: Date | null;
  title?: string;
  updatedAt?: Date;
};

type NeedFact = {
  companyId: string | null;
  id: string;
  personId: string | null;
  priority: TaskPriority;
  reviewAfter: Date | null;
  title: string;
};

type CapabilityFact = {
  id: string;
  title: string;
};

type IntroductionFact = {
  id: string;
  rationale: string;
};

type ProposalFact = {
  id: string;
  title: string;
};

export type RelationshipHealthFacts = {
  capabilities: CapabilityFact[];
  capabilityCount: number;
  commitments: CommitmentFact[];
  commitmentCount: number;
  entity: {
    id: string;
    label: string;
    type: RelationshipEntityType;
  };
  introductions: IntroductionFact[];
  introductionCount: number;
  meetings: InteractionFact[];
  needs: NeedFact[];
  needCount: number;
  notes: InteractionFact[];
  proposals: ProposalFact[];
  proposalCount: number;
  taskCount: number;
  tasks: TaskFact[];
};

type RelationshipHealthOptions = {
  now?: Date;
};

function truncate(text: string, max = 72) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

function ageInDays(date: Date, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_IN_MS));
}

function commitmentDueBoundary(commitment: CommitmentFact) {
  return commitment.dueAt ?? commitment.dueWindowEnd ?? commitment.dueWindowStart;
}

function isTaskOverdue(task: TaskFact, now: Date) {
  return task.dueAt !== null && task.dueAt < now;
}

function isTaskUpcoming(task: TaskFact, now: Date) {
  return (
    task.dueAt !== null &&
    task.dueAt >= now &&
    task.dueAt <= addDays(now, UPCOMING_DUE_DAYS)
  );
}

function isCommitmentOverdue(commitment: CommitmentFact, now: Date) {
  const due = commitmentDueBoundary(commitment);

  return due !== null && due < now && commitment.status !== "WAITING";
}

function isCommitmentUpcoming(commitment: CommitmentFact, now: Date) {
  const due = commitmentDueBoundary(commitment);

  return (
    due !== null &&
    due >= now &&
    due <= addDays(now, UPCOMING_DUE_DAYS)
  );
}

function startOfUtcDayTime(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isNeedReviewDue(need: NeedFact, now: Date) {
  return (
    need.reviewAfter !== null &&
    startOfUtcDayTime(need.reviewAfter) <= startOfUtcDayTime(now)
  );
}

function taskSeverity(priority: TaskPriority): WhyNowSeverity {
  if (priority === "CRITICAL") {
    return "CRITICAL";
  }

  if (priority === "HIGH") {
    return "HIGH";
  }

  return "MEDIUM";
}

function priorityLabel(priority: TaskPriority) {
  switch (priority) {
    case "CRITICAL":
      return "critical";
    case "HIGH":
      return "high";
    case "LOW":
      return "low";
    case "MEDIUM":
      return "medium";
  }
}

function needReviewSeverity(priority: TaskPriority): WhyNowSeverity {
  if (priority === "CRITICAL") {
    return "CRITICAL";
  }

  if (priority === "HIGH") {
    return "HIGH";
  }

  return "MEDIUM";
}

function severityRank(severity: WhyNowSeverity) {
  switch (severity) {
    case "CRITICAL":
      return 4;
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
  }
}

function signalRank(signal: RelationshipHealthSignal) {
  switch (signal) {
    case "NEEDS_ATTENTION":
      return 6;
    case "DORMANT":
      return 5;
    case "STALE":
      return 4;
    case "WARM":
      return 3;
    case "ACTIVE":
      return 2;
    case "UNKNOWN":
      return 1;
  }
}

function reasonSort(first: WhyNowReason, second: WhyNowReason) {
  const severityDifference =
    severityRank(second.severity) - severityRank(first.severity);

  if (severityDifference !== 0) {
    return severityDifference;
  }

  return (
    (first.date?.getTime() ?? Number.MAX_SAFE_INTEGER) -
    (second.date?.getTime() ?? Number.MAX_SAFE_INTEGER)
  );
}

function reasonEntity(entity: RelationshipHealthFacts["entity"]) {
  return {
    relatedEntityId: entity.id,
    relatedEntityType: entity.type,
  };
}

function selfHref(entity: RelationshipHealthFacts["entity"]) {
  return entity.type === "PERSON"
    ? `/people/${entity.id}`
    : `/people/companies/${entity.id}`;
}

function latestInteraction(facts: RelationshipHealthFacts) {
  const meeting = facts.meetings[0] ?? null;
  const note = facts.notes[0] ?? null;
  const meetingDate = meeting ? meeting.occurredAt ?? meeting.createdAt : null;
  const noteDate = note ? note.updatedAt ?? note.createdAt : null;

  if (meeting && note && meetingDate && noteDate) {
    return meetingDate >= noteDate
      ? {
          date: meetingDate,
          href: `/meetings/${meeting.id}`,
          id: meeting.id,
          label: meeting.title ?? "Meeting",
          type: "RECENT_MEETING" as const,
        }
      : {
          date: noteDate,
          href: `/notes/${note.id}`,
          id: note.id,
          label: "Note",
          type: "RECENT_NOTE" as const,
        };
  }

  if (meetingDate && meeting) {
    return {
      date: meetingDate,
      href: `/meetings/${meeting.id}`,
      id: meeting.id,
      label: meeting.title ?? "Meeting",
      type: "RECENT_MEETING" as const,
    };
  }

  if (noteDate && note) {
    return {
      date: noteDate,
      href: `/notes/${note.id}`,
      id: note.id,
      label: "Note",
      type: "RECENT_NOTE" as const,
    };
  }

  return null;
}

function shouldShowNeedReviewReason(
  entity: RelationshipHealthFacts["entity"],
  need: NeedFact,
) {
  return entity.type !== "COMPANY" || need.personId === null;
}

function buildReasons(facts: RelationshipHealthFacts, now: Date) {
  const reasons: WhyNowReason[] = [];
  const entityHref = selfHref(facts.entity);
  const latest = latestInteraction(facts);

  for (const task of facts.tasks) {
    if (isTaskOverdue(task, now)) {
      reasons.push({
        date: task.dueAt,
        explanation: `The linked task "${truncate(task.title)}" is overdue.`,
        href: `/tasks/${task.id}`,
        label: "Overdue task",
        relatedEntityId: task.id,
        relatedEntityType: "TASK",
        severity: taskSeverity(task.priority),
        type: "OVERDUE_TASK",
      });
      continue;
    }

    if (isTaskUpcoming(task, now)) {
      reasons.push({
        date: task.dueAt,
        explanation: `The linked task "${truncate(
          task.title,
        )}" is due in the next ${UPCOMING_DUE_DAYS} days.`,
        href: `/tasks/${task.id}`,
        label: "Upcoming task",
        relatedEntityId: task.id,
        relatedEntityType: "TASK",
        severity: taskSeverity(task.priority),
        type: "UPCOMING_TASK",
      });
      continue;
    }

    if (task.priority === "HIGH" || task.priority === "CRITICAL") {
      reasons.push({
        date: task.dueAt,
        explanation: `There is a ${priorityLabel(
          task.priority,
        )}-priority open task linked to this relationship.`,
        href: `/tasks/${task.id}`,
        label: "High-priority open task",
        relatedEntityId: task.id,
        relatedEntityType: "TASK",
        severity: taskSeverity(task.priority),
        type: "OPEN_TASK",
      });
    }
  }

  for (const commitment of facts.commitments) {
    const due = commitmentDueBoundary(commitment);

    if (isCommitmentOverdue(commitment, now)) {
      reasons.push({
        date: due,
        explanation: `The linked commitment "${truncate(
          commitment.title,
        )}" is overdue.`,
        href: `/commitments/${commitment.id}`,
        label: "Overdue commitment",
        relatedEntityId: commitment.id,
        relatedEntityType: "COMMITMENT",
        severity: "HIGH",
        type: "OVERDUE_COMMITMENT",
      });
      continue;
    }

    if (isCommitmentUpcoming(commitment, now)) {
      reasons.push({
        date: due,
        explanation: `The linked commitment "${truncate(
          commitment.title,
        )}" is due soon.`,
        href: `/commitments/${commitment.id}`,
        label: "Upcoming commitment",
        relatedEntityId: commitment.id,
        relatedEntityType: "COMMITMENT",
        severity: "MEDIUM",
        type: "UPCOMING_COMMITMENT",
      });
      continue;
    }

    reasons.push({
      date: due,
      explanation: `There is an open commitment linked to this relationship.`,
      href: `/commitments/${commitment.id}`,
      label: "Open commitment",
      relatedEntityId: commitment.id,
      relatedEntityType: "COMMITMENT",
      severity: commitment.status === "WAITING" ? "LOW" : "MEDIUM",
      type: "OPEN_COMMITMENT",
    });
  }

  for (const need of facts.needs) {
    if (
      isNeedReviewDue(need, now) &&
      shouldShowNeedReviewReason(facts.entity, need)
    ) {
      reasons.push({
        date: need.reviewAfter,
        explanation: `The linked need "${truncate(
          need.title,
        )}" is due for human review.`,
        href: `/opportunities/needs/${need.id}`,
        label: "Need review due",
        relatedEntityId: need.id,
        relatedEntityType: "NEED",
        severity: needReviewSeverity(need.priority),
        type: "DUE_NEED_REVIEW",
      });
      continue;
    }

    reasons.push({
      explanation: `Active need: "${truncate(need.title)}".`,
      href: `/opportunities/needs/${need.id}`,
      label: "Active need",
      relatedEntityId: need.id,
      relatedEntityType: "NEED",
      severity: "LOW",
      type: "ACTIVE_NEED",
    });
  }

  for (const capability of facts.capabilities) {
    reasons.push({
      explanation: `Active capability: "${truncate(capability.title)}".`,
      href: `/opportunities/capabilities/${capability.id}`,
      label: "Active capability",
      relatedEntityId: capability.id,
      relatedEntityType: "CAPABILITY",
      severity: "LOW",
      type: "ACTIVE_CAPABILITY",
    });
  }

  for (const proposal of facts.proposals) {
    reasons.push({
      explanation: `Proposal "${truncate(
        proposal.title,
      )}" is waiting for status-only review.`,
      href: `/proposals/${proposal.id}`,
      label: "Pending proposal",
      relatedEntityId: proposal.id,
      relatedEntityType: "AI_PROPOSAL",
      severity: "MEDIUM",
      type: "PENDING_AI_PROPOSAL",
    });
  }

  if (latest) {
    const interactionAge = ageInDays(latest.date, now);

    if (interactionAge >= DORMANT_AFTER_DAYS) {
      reasons.push({
        date: latest.date,
        explanation: `The last meaningful interaction was ${interactionAge} days ago.`,
        href: entityHref,
        label: "Dormant relationship",
        ...reasonEntity(facts.entity),
        severity: "HIGH",
        type: "DORMANT_RELATIONSHIP",
      });
    } else if (interactionAge >= STALE_AFTER_DAYS) {
      reasons.push({
        date: latest.date,
        explanation: `The last meaningful interaction was ${interactionAge} days ago.`,
        href: entityHref,
        label: "Stale relationship",
        ...reasonEntity(facts.entity),
        severity: "MEDIUM",
        type: "STALE_RELATIONSHIP",
      });
    } else {
      reasons.push({
        date: latest.date,
        explanation:
          latest.type === "RECENT_MEETING"
            ? `Last meeting was ${interactionAge} days ago.`
            : `Last note was ${interactionAge} days ago.`,
        href: latest.href,
        label:
          latest.type === "RECENT_MEETING" ? "Recent meeting" : "Recent note",
        relatedEntityId: latest.id,
        relatedEntityType:
          latest.type === "RECENT_MEETING" ? "MEETING" : "NOTE",
        severity: "LOW",
        type: latest.type,
      });
    }
  }

  if (reasons.length === 0) {
    reasons.push({
      explanation:
        "There is not enough relationship activity yet to classify this record.",
      href: entityHref,
      label: "No relationship signals yet",
      ...reasonEntity(facts.entity),
      severity: "LOW",
      type: "NO_RELATIONSHIP_CONTEXT",
    });
  }

  return reasons.sort(reasonSort);
}

function determineSignal(
  facts: RelationshipHealthFacts,
  reasons: WhyNowReason[],
  now: Date,
): RelationshipHealthSignal {
  const hasOverdueAction = reasons.some(
    (reason) =>
      reason.type === "OVERDUE_TASK" ||
      reason.type === "OVERDUE_COMMITMENT" ||
      reason.type === "DUE_NEED_REVIEW" ||
      (reason.type === "OPEN_TASK" &&
        (reason.severity === "HIGH" || reason.severity === "CRITICAL")),
  );

  if (hasOverdueAction) {
    return "NEEDS_ATTENTION";
  }

  const latest = latestInteraction(facts);

  if (!latest) {
    return "UNKNOWN";
  }

  const interactionAge = ageInDays(latest.date, now);

  if (interactionAge <= ACTIVE_INTERACTION_DAYS) {
    return "ACTIVE";
  }

  if (interactionAge >= DORMANT_AFTER_DAYS) {
    return "DORMANT";
  }

  if (interactionAge >= STALE_AFTER_DAYS) {
    return "STALE";
  }

  if (
    interactionAge <= WARM_INTERACTION_DAYS ||
    interactionAge < STALE_AFTER_DAYS
  ) {
    return "WARM";
  }

  return "UNKNOWN";
}

function primarySignalReason(
  signal: RelationshipHealthSignal,
  reasons: WhyNowReason[],
) {
  switch (signal) {
    case "ACTIVE":
    case "WARM":
      return (
        reasons.find(
          (reason) =>
            reason.type === "RECENT_MEETING" || reason.type === "RECENT_NOTE",
        ) ?? reasons[0]
      );
    case "DORMANT":
      return (
        reasons.find((reason) => reason.type === "DORMANT_RELATIONSHIP") ??
        reasons[0]
      );
    case "STALE":
      return (
        reasons.find((reason) => reason.type === "STALE_RELATIONSHIP") ??
        reasons[0]
      );
    case "UNKNOWN":
      return (
        reasons.find((reason) => reason.type === "NO_RELATIONSHIP_CONTEXT") ??
        reasons[0]
      );
    case "NEEDS_ATTENTION":
      return reasons[0];
  }
}

function signalExplanation(
  signal: RelationshipHealthSignal,
  reasons: WhyNowReason[],
) {
  const first = primarySignalReason(signal, reasons);

  switch (signal) {
    case "NEEDS_ATTENTION":
      return first
        ? `Needs attention because ${first.explanation.toLowerCase()}`
        : "Needs attention based on linked relationship actions.";
    case "ACTIVE":
      return first
        ? `Active because ${first.explanation.toLowerCase()}`
        : "Active based on recent relationship context.";
    case "WARM":
      return first
        ? `Warm because ${first.explanation.toLowerCase()}`
        : "Warm based on existing relationship context.";
    case "STALE":
      return first
        ? `Stale because ${first.explanation.toLowerCase()}`
        : "Stale because meaningful interaction is overdue.";
    case "DORMANT":
      return first
        ? `Dormant because ${first.explanation.toLowerCase()}`
        : "Dormant because meaningful interaction is well outside the threshold.";
    case "UNKNOWN":
      return first
        ? `Unknown because ${first.explanation.toLowerCase()}`
        : "Unknown until more relationship context exists.";
  }
}

export function buildRelationshipHealth(
  facts: RelationshipHealthFacts,
  options: RelationshipHealthOptions = {},
): RelationshipHealth {
  const now = options.now ?? new Date();
  const reasons = buildReasons(facts, now);
  const signal = determineSignal(facts, reasons, now);
  const latest = latestInteraction(facts);
  const limitedReasons = reasons.slice(0, DETAIL_REASON_LIMIT);

  return {
    counts: {
      activeCapabilities: facts.capabilityCount,
      activeIntroductions: facts.introductionCount,
      activeNeeds: facts.needCount,
      openCommitments: facts.commitmentCount,
      openTasks: facts.taskCount,
      pendingProposals: facts.proposalCount,
    },
    entityId: facts.entity.id,
    entityLabel: facts.entity.label,
    entityType: facts.entity.type,
    explanation: signalExplanation(signal, reasons),
    lastInteractionAt: latest?.date ?? null,
    reasonCount: reasons.length,
    reasons: limitedReasons,
    signal,
  };
}

function attentionSort(first: RelationshipHealth, second: RelationshipHealth) {
  const signalDifference = signalRank(second.signal) - signalRank(first.signal);

  if (signalDifference !== 0) {
    return signalDifference;
  }

  const firstSeverity = first.reasons[0]?.severity ?? "LOW";
  const secondSeverity = second.reasons[0]?.severity ?? "LOW";
  const severityDifference =
    severityRank(secondSeverity) - severityRank(firstSeverity);

  if (severityDifference !== 0) {
    return severityDifference;
  }

  return (
    (first.lastInteractionAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
    (second.lastInteractionAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
  );
}

function hasAttentionValue(health: RelationshipHealth) {
  return (
    health.signal !== "UNKNOWN" ||
    health.counts.openTasks > 0 ||
    health.counts.openCommitments > 0 ||
    health.reasons.some((reason) => reason.type === "DUE_NEED_REVIEW") ||
    health.counts.pendingProposals > 0
  );
}

export async function getTenantPersonRelationshipHealth(
  context: TenantContext,
  personId: string,
  options: RelationshipHealthOptions = {},
) {
  await requireTenantAccess(context);

  const facts = await getPersonRelationshipHealthFacts({
    personId,
    tenantId: context.tenantId,
  });

  if (!facts.entity) {
    return null;
  }

  return buildRelationshipHealth(
    {
      ...facts,
      entity: {
        id: facts.entity.id,
        label: facts.entity.displayName,
        type: "PERSON",
      },
    },
    options,
  );
}

export async function getTenantCompanyRelationshipHealth(
  context: TenantContext,
  companyId: string,
  options: RelationshipHealthOptions = {},
) {
  await requireTenantAccess(context);

  const facts = await getCompanyRelationshipHealthFacts({
    companyId,
    tenantId: context.tenantId,
  });

  if (!facts.entity) {
    return null;
  }

  return buildRelationshipHealth(
    {
      ...facts,
      entity: {
        id: facts.entity.id,
        label: facts.entity.name,
        type: "COMPANY",
      },
    },
    options,
  );
}

export async function getTenantRelationshipAttentionBoard(
  context: TenantContext,
  options: RelationshipHealthOptions = {},
) {
  await requireTenantAccess(context);

  const [people, companies] = await Promise.all([
    listRelationshipHealthPeople(context.tenantId),
    listRelationshipHealthCompanies(context.tenantId),
  ]);
  const [personHealth, companyHealth] = await Promise.all([
    Promise.all(
      people.map((person) =>
        getTenantPersonRelationshipHealth(context, person.id, options),
      ),
    ),
    Promise.all(
      companies.map((company) =>
        getTenantCompanyRelationshipHealth(context, company.id, options),
      ),
    ),
  ]);
  const items = [...personHealth, ...companyHealth]
    .filter((health): health is RelationshipHealth => Boolean(health))
    .filter(hasAttentionValue)
    .sort(attentionSort)
    .slice(0, TODAY_ATTENTION_LIMIT);

  return {
    items,
    totals: {
      companies: companyHealth.filter(Boolean).length,
      people: personHealth.filter(Boolean).length,
      shown: items.length,
    },
  };
}
