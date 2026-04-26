import { describe, expect, it } from "vitest";

import {
  ACTIVE_INTERACTION_DAYS,
  buildRelationshipHealth,
  DORMANT_AFTER_DAYS,
  STALE_AFTER_DAYS,
  type RelationshipHealthFacts,
} from "@/server/services/relationship-health";

const now = new Date("2026-04-26T12:00:00.000Z");

function daysAgo(days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function baseFacts(
  overrides: Partial<RelationshipHealthFacts> = {},
): RelationshipHealthFacts {
  return {
    capabilities: [],
    capabilityCount: 0,
    commitments: [],
    commitmentCount: 0,
    entity: {
      id: "person_1",
      label: "Anna Keller",
      type: "PERSON",
    },
    introductions: [],
    introductionCount: 0,
    meetings: [],
    needs: [],
    needCount: 0,
    notes: [],
    proposals: [],
    proposalCount: 0,
    taskCount: 0,
    tasks: [],
    ...overrides,
  };
}

describe("relationship health computation", () => {
  it("classifies active, stale, and dormant relationships at threshold boundaries", () => {
    const active = buildRelationshipHealth(
      baseFacts({
        meetings: [
          {
            createdAt: daysAgo(ACTIVE_INTERACTION_DAYS),
            id: "meeting_active",
            occurredAt: daysAgo(ACTIVE_INTERACTION_DAYS),
            title: "Active meeting",
          },
        ],
      }),
      { now },
    );
    const stale = buildRelationshipHealth(
      baseFacts({
        notes: [
          {
            createdAt: daysAgo(STALE_AFTER_DAYS),
            id: "note_stale",
            updatedAt: daysAgo(STALE_AFTER_DAYS),
          },
        ],
      }),
      { now },
    );
    const dormant = buildRelationshipHealth(
      baseFacts({
        meetings: [
          {
            createdAt: daysAgo(DORMANT_AFTER_DAYS),
            id: "meeting_dormant",
            occurredAt: daysAgo(DORMANT_AFTER_DAYS),
            title: "Dormant meeting",
          },
        ],
      }),
      { now },
    );

    expect(active.signal).toBe("ACTIVE");
    expect(active.reasons.map((reason) => reason.type)).toContain(
      "RECENT_MEETING",
    );
    expect(stale.signal).toBe("STALE");
    expect(stale.reasons.map((reason) => reason.type)).toContain(
      "STALE_RELATIONSHIP",
    );
    expect(dormant.signal).toBe("DORMANT");
    expect(dormant.reasons.map((reason) => reason.type)).toContain(
      "DORMANT_RELATIONSHIP",
    );
  });

  it("prioritizes needs-attention when overdue or high-priority actions exist", () => {
    const health = buildRelationshipHealth(
      baseFacts({
        meetings: [
          {
            createdAt: daysAgo(1),
            id: "meeting_recent",
            occurredAt: daysAgo(1),
            title: "Recent meeting",
          },
        ],
        taskCount: 1,
        tasks: [
          {
            dueAt: daysAgo(1),
            id: "task_overdue",
            priority: "HIGH",
            title: "Send follow-up",
          },
        ],
      }),
      { now },
    );

    expect(health.signal).toBe("NEEDS_ATTENTION");
    expect(health.reasons[0]).toMatchObject({
      relatedEntityId: "task_overdue",
      relatedEntityType: "TASK",
      type: "OVERDUE_TASK",
    });
    expect(health.explanation).toContain("Needs attention because");
  });

  it("creates deterministic reasons for actions, opportunities, introductions, and proposals", () => {
    const health = buildRelationshipHealth(
      baseFacts({
        capabilities: [
          {
            id: "capability_1",
            title: "SE-CERT experience",
          },
        ],
        capabilityCount: 1,
        commitmentCount: 1,
        commitments: [
          {
            dueAt: new Date("2026-04-28T12:00:00.000Z"),
            dueWindowEnd: null,
            dueWindowStart: null,
            id: "commitment_1",
            status: "OPEN",
            title: "Share benchmark",
          },
        ],
        introductionCount: 1,
        introductions: [
          {
            id: "intro_1",
            rationale: "Connect Anna with Ben.",
          },
        ],
        needCount: 1,
        needs: [
          {
            id: "need_1",
            priority: "HIGH",
            title: "Find implementation examples",
          },
        ],
        proposalCount: 1,
        proposals: [
          {
            id: "proposal_1",
            title: "Review extracted context",
          },
        ],
        taskCount: 1,
        tasks: [
          {
            dueAt: new Date("2026-04-27T12:00:00.000Z"),
            id: "task_1",
            priority: "MEDIUM",
            title: "Follow up",
          },
        ],
      }),
      { now },
    );

    expect(health.reasons.map((reason) => reason.type)).toEqual(
      expect.arrayContaining([
        "UPCOMING_TASK",
        "UPCOMING_COMMITMENT",
        "ACTIVE_NEED",
        "ACTIVE_INTRODUCTION",
        "PENDING_AI_PROPOSAL",
      ]),
    );
    expect(health.reasonCount).toBeGreaterThan(health.reasons.length);

    const capabilityOnly = buildRelationshipHealth(
      baseFacts({
        capabilities: [
          {
            id: "capability_1",
            title: "SE-CERT experience",
          },
        ],
        capabilityCount: 1,
      }),
      { now },
    );

    expect(capabilityOnly.reasons.map((reason) => reason.type)).toContain(
      "ACTIVE_CAPABILITY",
    );
  });
});
