import type {
  CommitmentOwnerType,
  CommitmentStatus,
  Sensitivity,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";

import { getTenantCommitmentBoard } from "@/server/services/commitments";
import { getTenantTaskBoard } from "@/server/services/tasks";
import type { TenantContext } from "@/server/services/tenancy";

export type ActionItemSourceType = "COMMITMENT" | "TASK";

export type ActionItemContextBadgeType =
  | "commitment"
  | "company"
  | "meeting"
  | "note"
  | "person";

export type ActionItemContextBadge = {
  href: string;
  id: string;
  label: string;
  type: ActionItemContextBadgeType;
};

export type ActionBoardTask = {
  commitment: { id: string; title: string } | null;
  company: { id: string; name: string } | null;
  completedAt: Date | null;
  description: string | null;
  dueAt: Date | null;
  id: string;
  meeting: { id: string; title: string } | null;
  note: { id: string; noteType: string; summary: string | null } | null;
  person: { displayName: string; id: string } | null;
  priority: TaskPriority;
  status: TaskStatus;
  taskType: TaskType;
  title: string;
  whyNowRationale: string | null;
};

export type ActionBoardCommitment = {
  counterpartyCompany: { id: string; name: string } | null;
  counterpartyPerson: { displayName: string; id: string } | null;
  description: string | null;
  dueAt: Date | null;
  dueWindowEnd: Date | null;
  dueWindowStart: Date | null;
  id: string;
  meeting: { id: string; title: string } | null;
  note: { id: string; noteType: string; summary: string | null } | null;
  ownerCompany: { id: string; name: string } | null;
  ownerPerson: { displayName: string; id: string } | null;
  ownerType: CommitmentOwnerType;
  sensitivity: Sensitivity;
  status: CommitmentStatus;
  title: string;
  updatedAt: Date;
};

export type TaskActionItem = {
  contextBadges: ActionItemContextBadge[];
  description: string | null;
  dueAt: Date | null;
  dueWindowEnd: null;
  dueWindowStart: null;
  href: string;
  id: string;
  priority: TaskPriority;
  sourceType: "TASK";
  status: TaskStatus;
  taskType: TaskType;
  title: string;
};

export type CommitmentActionItem = {
  contextBadges: ActionItemContextBadge[];
  description: string | null;
  dueAt: Date | null;
  dueWindowEnd: Date | null;
  dueWindowStart: Date | null;
  href: string;
  id: string;
  ownerType: CommitmentOwnerType;
  sensitivity: Sensitivity;
  sourceType: "COMMITMENT";
  status: CommitmentStatus;
  title: string;
};

export type ActionBoardItem = CommitmentActionItem | TaskActionItem;

export type ActionBoard = {
  needsAttention: ActionBoardItem[];
  openWithoutDate: ActionBoardItem[];
  recentlyCompleted: ActionBoardItem[];
  totals: {
    needsAttention: number;
    openActionItems: number;
    openWithoutDate: number;
    recentlyCompleted: number;
    upcoming: number;
    waiting: number;
  };
  upcoming: ActionBoardItem[];
  waiting: ActionBoardItem[];
};

export type ActionBoardInput = {
  commitmentBoard: {
    dueToday: ActionBoardCommitment[];
    openWithoutDue: ActionBoardCommitment[];
    overdue: ActionBoardCommitment[];
    recentlyFulfilled: ActionBoardCommitment[];
    upcoming: ActionBoardCommitment[];
    waiting: ActionBoardCommitment[];
  };
  taskBoard: {
    dueToday: ActionBoardTask[];
    openWithoutDue: ActionBoardTask[];
    overdue: ActionBoardTask[];
    recentlyCompleted: ActionBoardTask[];
    upcoming: ActionBoardTask[];
  };
};

function isContextBadge(
  badge: ActionItemContextBadge | null,
): badge is ActionItemContextBadge {
  return Boolean(badge);
}

function noteLabel(note: { noteType: string; summary: string | null }) {
  return note.summary ?? `${note.noteType} note`;
}

function taskContextBadges(task: ActionBoardTask): ActionItemContextBadge[] {
  const badges: Array<ActionItemContextBadge | null> = [
    task.person
      ? {
          href: `/people/${task.person.id}`,
          id: task.person.id,
          label: task.person.displayName,
          type: "person" as const,
        }
      : null,
    task.company
      ? {
          href: `/people/companies/${task.company.id}`,
          id: task.company.id,
          label: task.company.name,
          type: "company" as const,
        }
      : null,
    task.meeting
      ? {
          href: `/meetings/${task.meeting.id}`,
          id: task.meeting.id,
          label: task.meeting.title,
          type: "meeting" as const,
        }
      : null,
    task.note
      ? {
          href: `/notes/${task.note.id}`,
          id: task.note.id,
          label: noteLabel(task.note),
          type: "note" as const,
        }
      : null,
    task.commitment
      ? {
          href: `/commitments/${task.commitment.id}`,
          id: task.commitment.id,
          label: task.commitment.title,
          type: "commitment" as const,
        }
      : null,
  ];

  return badges.filter(isContextBadge);
}

function commitmentContextBadges(
  commitment: ActionBoardCommitment,
): ActionItemContextBadge[] {
  const badges: Array<ActionItemContextBadge | null> = [
    commitment.ownerPerson
      ? {
          href: `/people/${commitment.ownerPerson.id}`,
          id: commitment.ownerPerson.id,
          label: `Owner: ${commitment.ownerPerson.displayName}`,
          type: "person" as const,
        }
      : null,
    commitment.ownerCompany
      ? {
          href: `/people/companies/${commitment.ownerCompany.id}`,
          id: commitment.ownerCompany.id,
          label: `Owner: ${commitment.ownerCompany.name}`,
          type: "company" as const,
        }
      : null,
    commitment.counterpartyPerson
      ? {
          href: `/people/${commitment.counterpartyPerson.id}`,
          id: commitment.counterpartyPerson.id,
          label: `With: ${commitment.counterpartyPerson.displayName}`,
          type: "person" as const,
        }
      : null,
    commitment.counterpartyCompany
      ? {
          href: `/people/companies/${commitment.counterpartyCompany.id}`,
          id: commitment.counterpartyCompany.id,
          label: `With: ${commitment.counterpartyCompany.name}`,
          type: "company" as const,
        }
      : null,
    commitment.meeting
      ? {
          href: `/meetings/${commitment.meeting.id}`,
          id: commitment.meeting.id,
          label: commitment.meeting.title,
          type: "meeting" as const,
        }
      : null,
    commitment.note
      ? {
          href: `/notes/${commitment.note.id}`,
          id: commitment.note.id,
          label: noteLabel(commitment.note),
          type: "note" as const,
        }
      : null,
  ];

  return badges.filter(isContextBadge);
}

function taskActionItem(task: ActionBoardTask): TaskActionItem {
  return {
    contextBadges: taskContextBadges(task),
    description: task.description ?? task.whyNowRationale,
    dueAt: task.dueAt,
    dueWindowEnd: null,
    dueWindowStart: null,
    href: `/tasks/${task.id}`,
    id: task.id,
    priority: task.priority,
    sourceType: "TASK",
    status: task.status,
    taskType: task.taskType,
    title: task.title,
  };
}

function commitmentActionItem(
  commitment: ActionBoardCommitment,
): CommitmentActionItem {
  return {
    contextBadges: commitmentContextBadges(commitment),
    description: commitment.description,
    dueAt: commitment.dueAt,
    dueWindowEnd: commitment.dueWindowEnd,
    dueWindowStart: commitment.dueWindowStart,
    href: `/commitments/${commitment.id}`,
    id: commitment.id,
    ownerType: commitment.ownerType,
    sensitivity: commitment.sensitivity,
    sourceType: "COMMITMENT",
    status: commitment.status,
    title: commitment.title,
  };
}

function dueBoundary(item: ActionBoardItem) {
  return item.dueAt ?? item.dueWindowEnd ?? item.dueWindowStart;
}

function sortByDueDate(items: ActionBoardItem[]) {
  return [...items].sort((first, second) => {
    const firstDue = dueBoundary(first)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const secondDue = dueBoundary(second)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (firstDue !== secondDue) {
      return firstDue - secondDue;
    }

    return first.title.localeCompare(second.title);
  });
}

export function buildActionBoard(input: ActionBoardInput): ActionBoard {
  const needsAttention = sortByDueDate([
    ...input.taskBoard.overdue.map(taskActionItem),
    ...input.taskBoard.dueToday.map(taskActionItem),
    ...input.commitmentBoard.overdue.map(commitmentActionItem),
    ...input.commitmentBoard.dueToday.map(commitmentActionItem),
  ]);
  const upcoming = sortByDueDate([
    ...input.taskBoard.upcoming.map(taskActionItem),
    ...input.commitmentBoard.upcoming.map(commitmentActionItem),
  ]);
  const waiting = sortByDueDate(
    input.commitmentBoard.waiting.map(commitmentActionItem),
  );
  const openWithoutDate = sortByDueDate([
    ...input.taskBoard.openWithoutDue.map(taskActionItem),
    ...input.commitmentBoard.openWithoutDue.map(commitmentActionItem),
  ]);
  const recentlyCompleted = [
    ...input.taskBoard.recentlyCompleted.map(taskActionItem),
    ...input.commitmentBoard.recentlyFulfilled.map(commitmentActionItem),
  ];

  return {
    needsAttention,
    openWithoutDate,
    recentlyCompleted,
    totals: {
      needsAttention: needsAttention.length,
      openActionItems:
        needsAttention.length +
        upcoming.length +
        waiting.length +
        openWithoutDate.length,
      openWithoutDate: openWithoutDate.length,
      recentlyCompleted: recentlyCompleted.length,
      upcoming: upcoming.length,
      waiting: waiting.length,
    },
    upcoming,
    waiting,
  };
}

export async function getTenantActionBoard(context: TenantContext) {
  const [taskBoard, commitmentBoard] = await Promise.all([
    getTenantTaskBoard(context),
    getTenantCommitmentBoard(context),
  ]);

  return buildActionBoard({
    commitmentBoard,
    taskBoard,
  });
}
