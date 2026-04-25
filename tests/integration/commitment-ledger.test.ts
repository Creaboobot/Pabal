// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import {
  archiveTenantCommitment,
  cancelTenantCommitment,
  createTenantCommitment,
  fulfillTenantCommitment,
  getTenantCommitment,
  getTenantCommitmentProfile,
  groupCommitmentBoard,
  listTenantCommitmentsWithContext,
  updateTenantCommitment,
} from "@/server/services/commitments";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantMeeting } from "@/server/services/meetings";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { createTenantTask } from "@/server/services/tasks";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

async function createCommitmentContext(email: string) {
  const context = await createTenantContext(email);
  const company = await createTenantCompany(context, {
    name: `${email} Company`,
  });
  const person = await createTenantPerson(context, {
    displayName: `${email} Person`,
  });
  const meeting = await createTenantMeeting(context, {
    primaryCompanyId: company.id,
    title: `${email} Meeting`,
  });
  const note = await createTenantNote(context, {
    body: `${email} note body`,
    companyId: company.id,
    meetingId: meeting.id,
    noteType: "MEETING",
    personId: person.id,
    summary: `${email} note summary`,
  });

  return {
    company,
    context,
    meeting,
    note,
    person,
  };
}

describeWithDatabase("commitment ledger workflow", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates and safely links a commitment to supported tenant records", async () => {
    const data = await createCommitmentContext("linked-commitment@example.com");
    const commitment = await createTenantCommitment(data.context, {
      counterpartyCompanyId: data.company.id,
      counterpartyPersonId: data.person.id,
      description: "Do not leak this description into audit metadata.",
      dueAt: new Date("2026-04-24T10:00:00.000Z"),
      meetingId: data.meeting.id,
      noteId: data.note.id,
      ownerPersonId: data.person.id,
      ownerType: "OTHER_PERSON",
      sensitivity: "SENSITIVE_BUSINESS",
      title: "Send benchmark outline",
    });

    await expect(
      getTenantCommitmentProfile(data.context, commitment.id),
    ).resolves.toMatchObject({
      counterpartyCompanyId: data.company.id,
      counterpartyPersonId: data.person.id,
      meetingId: data.meeting.id,
      noteId: data.note.id,
      ownerPersonId: data.person.id,
      tenantId: data.context.tenantId,
    });

    const auditLog = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: "commitment.created",
        entityId: commitment.id,
        tenantId: data.context.tenantId,
      },
    });
    const metadata = JSON.stringify(auditLog.metadata);

    expect(metadata).toContain(data.person.id);
    expect(metadata).toContain("SENSITIVE_BUSINESS");
    expect(metadata).not.toContain("Do not leak this description");
  });

  it("edits, fulfils, cancels, and archives commitments", async () => {
    const data = await createCommitmentContext("commitment-lifecycle@example.com");
    const commitment = await createTenantCommitment(data.context, {
      ownerType: "ME",
      title: "Initial title",
    });
    const updated = await updateTenantCommitment(data.context, commitment.id, {
      counterpartyCompanyId: data.company.id,
      ownerType: "ME",
      status: "WAITING",
      title: "Updated title",
    });

    expect(updated).toMatchObject({
      counterpartyCompanyId: data.company.id,
      status: "WAITING",
      title: "Updated title",
    });

    const fulfilled = await fulfillTenantCommitment(data.context, commitment.id);

    expect(fulfilled.status).toBe("DONE");

    const cancelTarget = await createTenantCommitment(data.context, {
      ownerType: "ME",
      title: "Cancel target",
    });
    const cancelled = await cancelTenantCommitment(
      data.context,
      cancelTarget.id,
    );

    expect(cancelled.status).toBe("CANCELLED");

    const archived = await archiveTenantCommitment(
      data.context,
      commitment.id,
    );

    expect(archived.archivedAt).toBeInstanceOf(Date);
    await expect(
      getTenantCommitment(data.context, commitment.id),
    ).resolves.toBeNull();
    await expect(
      prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              "commitment.updated",
              "commitment.fulfilled",
              "commitment.cancelled",
              "commitment.archived",
            ],
          },
          tenantId: data.context.tenantId,
        },
      }),
    ).resolves.toHaveLength(4);
  });

  it("rejects impossible owner combinations", async () => {
    const data = await createCommitmentContext("invalid-owner@example.com");

    await expect(
      createTenantCommitment(data.context, {
        ownerPersonId: data.person.id,
        ownerType: "ME",
        title: "Invalid owner",
      }),
    ).rejects.toThrow("ME commitments cannot include");
    await expect(
      createTenantCommitment(data.context, {
        ownerType: "OTHER_PERSON",
        title: "Missing owner person",
      }),
    ).rejects.toThrow("owner person");
    await expect(
      createTenantCommitment(data.context, {
        ownerType: "COMPANY",
        title: "Missing owner company",
      }),
    ).rejects.toThrow("owner company");
  });

  it("rejects cross-tenant commitment reads, writes, and links", async () => {
    const first = await createCommitmentContext("first-cross-commitment@example.com");
    const second = await createCommitmentContext(
      "second-cross-commitment@example.com",
    );
    const commitment = await createTenantCommitment(first.context, {
      counterpartyPersonId: first.person.id,
      ownerType: "ME",
      title: "Tenant scoped commitment",
    });

    await expect(
      getTenantCommitment(second.context, commitment.id),
    ).resolves.toBeNull();
    await expect(
      updateTenantCommitment(second.context, commitment.id, {
        ownerType: "ME",
        title: "Invalid update",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      createTenantCommitment(first.context, {
        counterpartyPersonId: second.person.id,
        ownerType: "ME",
        title: "Invalid cross tenant link",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("keeps Today commitment board summaries tenant-scoped", async () => {
    const first = await createCommitmentContext("first-board-commitment@example.com");
    const second = await createCommitmentContext(
      "second-board-commitment@example.com",
    );
    const now = new Date("2026-04-24T10:00:00.000Z");
    const yesterday = new Date("2026-04-23T12:00:00.000Z");
    const today = new Date("2026-04-24T12:00:00.000Z");
    const nextWeek = new Date("2026-05-01T12:00:00.000Z");

    await createTenantCommitment(first.context, {
      dueAt: yesterday,
      ownerType: "ME",
      title: "First overdue",
    });
    await createTenantCommitment(first.context, {
      dueAt: today,
      ownerType: "ME",
      title: "First due today",
    });
    await createTenantCommitment(first.context, {
      dueAt: nextWeek,
      ownerType: "ME",
      title: "First upcoming",
    });
    await createTenantCommitment(first.context, {
      ownerType: "ME",
      status: "WAITING",
      title: "First waiting",
    });
    const fulfilled = await createTenantCommitment(first.context, {
      ownerType: "ME",
      title: "First fulfilled",
    });
    await fulfillTenantCommitment(first.context, fulfilled.id);
    await createTenantCommitment(second.context, {
      dueAt: yesterday,
      ownerType: "ME",
      title: "Second tenant commitment",
    });

    const board = groupCommitmentBoard(
      await listTenantCommitmentsWithContext(first.context),
      now,
    );

    expect(board.overdue.map((commitment) => commitment.title)).toContain(
      "First overdue",
    );
    expect(board.dueToday.map((commitment) => commitment.title)).toContain(
      "First due today",
    );
    expect(board.upcoming.map((commitment) => commitment.title)).toContain(
      "First upcoming",
    );
    expect(board.waiting.map((commitment) => commitment.title)).toContain(
      "First waiting",
    );
    expect(
      board.recentlyFulfilled.map((commitment) => commitment.title),
    ).toContain("First fulfilled");
    expect(
      [
        ...board.overdue,
        ...board.dueToday,
        ...board.upcoming,
        ...board.waiting,
        ...board.recentlyFulfilled,
      ].map((commitment) => commitment.title),
    ).not.toContain("Second tenant commitment");
  });

  it("shows linked tasks through the existing task commitment relation", async () => {
    const data = await createCommitmentContext("linked-task-commitment@example.com");
    const commitment = await createTenantCommitment(data.context, {
      ownerType: "ME",
      title: "Commitment with task",
    });

    await createTenantTask(data.context, {
      commitmentId: commitment.id,
      taskType: "COMMITMENT",
      title: "Follow up on commitment",
    });

    const profile = await getTenantCommitmentProfile(
      data.context,
      commitment.id,
    );

    expect(profile?.tasks).toHaveLength(1);
    expect(profile?.tasks[0]?.title).toBe("Follow up on commitment");
  });
});
