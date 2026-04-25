// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createTenantCompany } from "@/server/services/companies";
import {
  archiveTenantMeeting,
  createTenantMeeting,
  createTenantMeetingParticipant,
  DuplicateMeetingParticipantError,
  getTenantMeeting,
  removeTenantMeetingParticipant,
  updateTenantMeeting,
} from "@/server/services/meetings";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

describeWithDatabase("meetings foundation tenant isolation", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates, updates, and archives meetings with safe audit metadata", async () => {
    const context = await createTenantContext("meeting-flow@example.com");
    const company = await createTenantCompany(context, {
      name: "Nordic Industrials",
    });
    const meeting = await createTenantMeeting(context, {
      occurredAt: new Date("2026-04-24T10:00:00.000Z"),
      primaryCompanyId: company.id,
      sourceType: "MANUAL",
      summary: "Detailed sensitive meeting summary that must not be audited.",
      title: "MBSE readiness discussion",
    });

    expect(meeting).toMatchObject({
      primaryCompanyId: company.id,
      sourceType: "MANUAL",
      tenantId: context.tenantId,
    });

    const updated = await updateTenantMeeting(context, meeting.id, {
      location: "Teams",
      occurredAt: new Date("2026-04-24T10:30:00.000Z"),
      sourceType: "MANUAL",
      summary: "Updated sensitive meeting summary.",
      title: "Updated MBSE readiness discussion",
    });

    expect(updated.title).toBe("Updated MBSE readiness discussion");

    const archived = await archiveTenantMeeting(context, meeting.id);

    expect(archived.archivedAt).toBeInstanceOf(Date);
    await expect(getTenantMeeting(context, meeting.id)).resolves.toBeNull();

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    const auditPayload = JSON.stringify(auditLogs);

    expect(auditLogs.map((log) => log.action)).toEqual(
      expect.arrayContaining([
        "meeting.created",
        "meeting.updated",
        "meeting.archived",
      ]),
    );
    expect(auditPayload).not.toContain("Detailed sensitive meeting summary");
    expect(auditPayload).not.toContain("Updated sensitive meeting summary");
  });

  it("adds and removes a participant by deleting only the association", async () => {
    const context = await createTenantContext("participant-flow@example.com");
    const company = await createTenantCompany(context, {
      name: "Vestas Energy",
    });
    const person = await createTenantPerson(context, {
      displayName: "Peter Hansen",
      email: "peter@example.com",
    });
    const meeting = await createTenantMeeting(context, {
      occurredAt: new Date("2026-04-24T10:00:00.000Z"),
      title: "MBSE readiness discussion",
    });
    const participant = await createTenantMeetingParticipant(context, {
      companyId: company.id,
      meetingId: meeting.id,
      participantRole: "HOST",
      personId: person.id,
    });

    expect(participant.nameSnapshot).toBe("Peter Hansen");
    expect(participant.emailSnapshot).toBe("peter@example.com");

    await removeTenantMeetingParticipant(context, meeting.id, participant.id);

    await expect(
      prisma.meetingParticipant.count({
        where: {
          id: participant.id,
          tenantId: context.tenantId,
        },
      }),
    ).resolves.toBe(0);
    await expect(
      prisma.meeting.count({ where: { id: meeting.id } }),
    ).resolves.toBe(1);
    await expect(
      prisma.person.count({ where: { id: person.id } }),
    ).resolves.toBe(1);
    await expect(
      prisma.company.count({ where: { id: company.id } }),
    ).resolves.toBe(1);

    const removedAuditLog = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: "meeting_participant.removed",
        tenantId: context.tenantId,
      },
    });

    expect(JSON.stringify(removedAuditLog.metadata)).not.toContain(
      "peter@example.com",
    );
  });

  it("rejects duplicate known-person participants", async () => {
    const context = await createTenantContext("duplicate-participant@example.com");
    const person = await createTenantPerson(context, {
      displayName: "Anna Keller",
    });
    const meeting = await createTenantMeeting(context, {
      occurredAt: new Date("2026-04-24T10:00:00.000Z"),
      title: "Follow-up discussion",
    });

    await createTenantMeetingParticipant(context, {
      meetingId: meeting.id,
      personId: person.id,
    });

    await expect(
      createTenantMeetingParticipant(context, {
        meetingId: meeting.id,
        personId: person.id,
      }),
    ).rejects.toBeInstanceOf(DuplicateMeetingParticipantError);
  });

  it("rejects cross-tenant meeting participant creation and removal", async () => {
    const firstContext = await createTenantContext("first-meeting@example.com");
    const secondContext = await createTenantContext("second-meeting@example.com");
    const meeting = await createTenantMeeting(firstContext, {
      occurredAt: new Date("2026-04-24T10:00:00.000Z"),
      title: "Tenant-owned meeting",
    });
    const firstPerson = await createTenantPerson(firstContext, {
      displayName: "Tenant Person",
    });
    const secondPerson = await createTenantPerson(secondContext, {
      displayName: "Other Tenant Person",
    });
    const participant = await createTenantMeetingParticipant(firstContext, {
      meetingId: meeting.id,
      personId: firstPerson.id,
    });

    await expect(
      createTenantMeetingParticipant(firstContext, {
        meetingId: meeting.id,
        personId: secondPerson.id,
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);

    await expect(
      removeTenantMeetingParticipant(
        secondContext,
        meeting.id,
        participant.id,
      ),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("fails cross-tenant meeting reads and writes safely", async () => {
    const firstContext = await createTenantContext("first-read@example.com");
    const secondContext = await createTenantContext("second-read@example.com");
    const meeting = await createTenantMeeting(firstContext, {
      occurredAt: new Date("2026-04-24T10:00:00.000Z"),
      title: "Private tenant meeting",
    });

    await expect(getTenantMeeting(secondContext, meeting.id)).resolves.toBeNull();
    await expect(
      updateTenantMeeting(secondContext, meeting.id, {
        occurredAt: new Date("2026-04-24T11:00:00.000Z"),
        title: "Cross-tenant update",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      archiveTenantMeeting(secondContext, meeting.id),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("adds manual source defaults to meetings and notes", async () => {
    const context = await createTenantContext("source-defaults@example.com");
    const meeting = await createTenantMeeting(context, {
      occurredAt: new Date("2026-04-24T10:00:00.000Z"),
      title: "Manual source meeting",
    });
    const note = await createTenantNote(context, {
      body: "Manual note body",
      meetingId: meeting.id,
      noteType: "MEETING",
    });

    expect(meeting.sourceType).toBe("MANUAL");
    expect(note.sourceType).toBe("MANUAL");
  });
});
