import { describe, expect, it } from "vitest";

import {
  buildActionBoard,
  type ActionBoardCommitment,
  type ActionBoardTask,
} from "@/server/services/action-board";
import { groupCommitmentBoard } from "@/server/services/commitments";
import { groupTaskBoard } from "@/server/services/tasks";

const now = new Date("2026-05-17T12:00:00.000Z");

function task(input: Partial<ActionBoardTask> & { id: string; title: string }) {
  const { id, title, ...overrides } = input;

  return {
    commitment: null,
    company: null,
    completedAt: null,
    description: null,
    dueAt: null,
    id,
    meeting: null,
    note: null,
    person: null,
    priority: "MEDIUM",
    status: "OPEN",
    taskType: "FOLLOW_UP",
    title,
    whyNowRationale: null,
    ...overrides,
  } satisfies ActionBoardTask;
}

function commitment(
  input: Partial<ActionBoardCommitment> & { id: string; title: string },
) {
  const { id, title, ...overrides } = input;

  return {
    counterpartyCompany: null,
    counterpartyPerson: null,
    description: null,
    dueAt: null,
    dueWindowEnd: null,
    dueWindowStart: null,
    id,
    meeting: null,
    note: null,
    ownerCompany: null,
    ownerPerson: null,
    ownerType: "ME",
    sensitivity: "NORMAL",
    status: "OPEN",
    title,
    updatedAt: new Date("2026-05-17T10:00:00.000Z"),
    ...overrides,
  } satisfies ActionBoardCommitment;
}

function actionBoard(input: {
  commitments: ActionBoardCommitment[];
  tasks: ActionBoardTask[];
}) {
  const taskBoard = groupTaskBoard(
    input.tasks as unknown as Parameters<typeof groupTaskBoard>[0],
    now,
  );
  const commitmentBoard = groupCommitmentBoard(
    input.commitments as unknown as Parameters<typeof groupCommitmentBoard>[0],
    now,
  );

  return buildActionBoard({
    commitmentBoard,
    taskBoard,
  });
}

describe("action board", () => {
  it("groups tasks and commitments into unified action sections", () => {
    const board = actionBoard({
      commitments: [
        commitment({
          dueAt: new Date("2026-05-15T10:00:00.000Z"),
          id: "commitment_overdue",
          title: "Commitment overdue",
        }),
        commitment({
          dueAt: new Date("2026-05-17T16:00:00.000Z"),
          id: "commitment_today",
          title: "Commitment due today",
        }),
        commitment({
          dueAt: new Date("2026-05-20T16:00:00.000Z"),
          id: "commitment_upcoming",
          title: "Commitment upcoming",
        }),
        commitment({
          id: "commitment_waiting",
          status: "WAITING",
          title: "Commitment waiting",
        }),
        commitment({
          id: "commitment_open_no_date",
          title: "Commitment without date",
        }),
        commitment({
          id: "commitment_done",
          status: "DONE",
          title: "Commitment fulfilled",
          updatedAt: new Date("2026-05-16T10:00:00.000Z"),
        }),
      ],
      tasks: [
        task({
          dueAt: new Date("2026-05-15T09:00:00.000Z"),
          id: "task_overdue",
          title: "Task overdue",
        }),
        task({
          dueAt: new Date("2026-05-17T13:00:00.000Z"),
          id: "task_today",
          title: "Task due today",
        }),
        task({
          dueAt: new Date("2026-05-20T09:00:00.000Z"),
          id: "task_upcoming",
          title: "Task upcoming",
        }),
        task({
          id: "task_open_no_date",
          title: "Task without date",
        }),
        task({
          completedAt: new Date("2026-05-16T11:00:00.000Z"),
          id: "task_done",
          status: "DONE",
          title: "Task completed",
        }),
      ],
    });

    expect(board.needsAttention.map((item) => item.id)).toEqual([
      "task_overdue",
      "commitment_overdue",
      "task_today",
      "commitment_today",
    ]);
    expect(board.upcoming.map((item) => item.id)).toEqual([
      "task_upcoming",
      "commitment_upcoming",
    ]);
    expect(board.waiting.map((item) => item.id)).toEqual([
      "commitment_waiting",
    ]);
    expect(board.openWithoutDate.map((item) => item.id)).toEqual([
      "commitment_open_no_date",
      "task_open_no_date",
    ]);
    expect(board.recentlyCompleted.map((item) => item.id)).toEqual([
      "task_done",
      "commitment_done",
    ]);
    expect(board.totals.openActionItems).toBe(9);
  });

  it("retains source-specific links and relationship context badges", () => {
    const board = actionBoard({
      commitments: [
        commitment({
          counterpartyPerson: {
            displayName: "Anna Keller",
            id: "person_anna",
          },
          dueAt: new Date("2026-05-17T16:00:00.000Z"),
          id: "commitment_context",
          title: "Commitment with context",
        }),
      ],
      tasks: [
        task({
          dueAt: new Date("2026-05-17T13:00:00.000Z"),
          id: "task_context",
          person: {
            displayName: "Sofia Chen",
            id: "person_sofia",
          },
          title: "Task with context",
        }),
      ],
    });

    expect(board.needsAttention).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "/tasks/task_context",
          id: "task_context",
          sourceType: "TASK",
        }),
        expect.objectContaining({
          href: "/commitments/commitment_context",
          id: "commitment_context",
          sourceType: "COMMITMENT",
        }),
      ]),
    );
    expect(board.needsAttention[0]?.contextBadges).toContainEqual({
      href: "/people/person_sofia",
      id: "person_sofia",
      label: "Sofia Chen",
      type: "person",
    });
    expect(board.needsAttention[1]?.contextBadges).toContainEqual({
      href: "/people/person_anna",
      id: "person_anna",
      label: "With: Anna Keller",
      type: "person",
    });
  });
});
