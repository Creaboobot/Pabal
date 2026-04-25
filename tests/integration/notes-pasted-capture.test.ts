// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createTenantPastedMeetingCapture } from "@/server/services/capture";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantMeeting } from "@/server/services/meetings";
import {
  archiveTenantNote,
  createTenantNote,
  getTenantNote,
  updateTenantNote,
} from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { createTenantSourceReference } from "@/server/services/source-references";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

describeWithDatabase("notes and pasted capture tenant isolation", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates, updates, and archives notes with safe audit metadata", async () => {
    const context = await createTenantContext("notes-flow@example.com");
    const note = await createTenantNote(context, {
      body: "Sensitive pasted body that must never be copied into audit logs.",
      noteType: "GENERAL",
      sensitivity: "CONFIDENTIAL",
      sourceType: "MANUAL",
      summary: "Sensitive summary that must not be copied into audit logs.",
    });

    expect(note).toMatchObject({
      noteType: "GENERAL",
      sensitivity: "CONFIDENTIAL",
      sourceType: "MANUAL",
      tenantId: context.tenantId,
    });

    const updated = await updateTenantNote(context, note.id, {
      body: "Updated body that must never be copied into audit logs.",
      noteType: "GENERAL",
      sensitivity: "NORMAL",
      sourceType: "MANUAL",
      summary: "Updated summary that must not be copied into audit logs.",
    });

    expect(updated.sensitivity).toBe("NORMAL");

    const archived = await archiveTenantNote(context, note.id);

    expect(archived.archivedAt).toBeInstanceOf(Date);
    await expect(getTenantNote(context, note.id)).resolves.toBeNull();

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
        "note.created",
        "note.updated",
        "note.archived",
      ]),
    );
    expect(auditPayload).toContain("bodyLength");
    expect(auditPayload).not.toContain("Sensitive pasted body");
    expect(auditPayload).not.toContain("Sensitive summary");
    expect(auditPayload).not.toContain("Updated body");
    expect(auditPayload).not.toContain("Updated summary");
  });

  it("creates notes linked to meeting, person, and company context", async () => {
    const context = await createTenantContext("note-links@example.com");
    const person = await createTenantPerson(context, {
      displayName: "Anna Keller",
    });
    const company = await createTenantCompany(context, {
      name: "Nordic Industrials",
    });
    const meeting = await createTenantMeeting(context, {
      occurredAt: new Date("2026-04-24T10:00:00.000Z"),
      primaryCompanyId: company.id,
      title: "Relationship context meeting",
    });

    const note = await createTenantNote(context, {
      body: "Manual note body.",
      companyId: company.id,
      meetingId: meeting.id,
      noteType: "MEETING",
      personId: person.id,
      sensitivity: "NORMAL",
      sourceType: "MANUAL",
    });

    expect(note).toMatchObject({
      companyId: company.id,
      meetingId: meeting.id,
      personId: person.id,
      tenantId: context.tenantId,
    });
  });

  it("fails note cross-tenant reads, writes, and linking safely", async () => {
    const firstContext = await createTenantContext("notes-first@example.com");
    const secondContext = await createTenantContext("notes-second@example.com");
    const secondPerson = await createTenantPerson(secondContext, {
      displayName: "Other tenant person",
    });
    const note = await createTenantNote(firstContext, {
      body: "Tenant-owned body.",
      noteType: "GENERAL",
    });

    await expect(getTenantNote(secondContext, note.id)).resolves.toBeNull();
    await expect(
      updateTenantNote(secondContext, note.id, {
        body: "Cross-tenant update.",
        noteType: "GENERAL",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      createTenantNote(firstContext, {
        body: "Cross-tenant link.",
        noteType: "PERSON",
        personId: secondPerson.id,
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("creates pasted capture as one meeting, one linked note, and one source reference", async () => {
    const context = await createTenantContext("pasted-flow@example.com");
    const company = await createTenantCompany(context, {
      name: "Vestas Energy",
    });
    const person = await createTenantPerson(context, {
      displayName: "Peter Hansen",
      email: "peter@example.com",
    });

    const result = await createTenantPastedMeetingCapture(context, {
      body: "Teams/Copilot raw pasted text that must not be audited.",
      occurredAt: new Date("2026-04-24T10:00:00.000Z"),
      participantPersonIds: [person.id],
      primaryCompanyId: company.id,
      sensitivity: "SENSITIVE_BUSINESS",
      summary: "Manual summary that must not be audited.",
      title: "Pasted client discussion",
    });

    await expect(
      prisma.meeting.count({ where: { tenantId: context.tenantId } }),
    ).resolves.toBe(1);
    await expect(
      prisma.note.count({ where: { tenantId: context.tenantId } }),
    ).resolves.toBe(1);
    await expect(
      prisma.meetingParticipant.count({
        where: { tenantId: context.tenantId },
      }),
    ).resolves.toBe(1);

    expect(result.meeting.sourceType).toBe("TEAMS_COPILOT_PASTE");
    expect(result.note).toMatchObject({
      companyId: company.id,
      meetingId: result.meeting.id,
      noteType: "MEETING",
      sensitivity: "SENSITIVE_BUSINESS",
      sourceType: "TEAMS_COPILOT_PASTE",
    });
    expect(result.sourceReference).toMatchObject({
      sourceEntityId: result.note.id,
      sourceEntityType: "NOTE",
      targetEntityId: result.meeting.id,
      targetEntityType: "MEETING",
      tenantId: context.tenantId,
    });

    await expect(
      prisma.aIProposal.count({ where: { tenantId: context.tenantId } }),
    ).resolves.toBe(0);
    await expect(
      prisma.task.count({ where: { tenantId: context.tenantId } }),
    ).resolves.toBe(0);
    await expect(
      prisma.commitment.count({ where: { tenantId: context.tenantId } }),
    ).resolves.toBe(0);
    await expect(
      prisma.need.count({ where: { tenantId: context.tenantId } }),
    ).resolves.toBe(0);
    await expect(
      prisma.capability.count({ where: { tenantId: context.tenantId } }),
    ).resolves.toBe(0);

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
      },
    });
    const auditPayload = JSON.stringify(auditLogs);

    expect(auditLogs.map((log) => log.action)).toEqual(
      expect.arrayContaining([
        "meeting.created",
        "meeting_participant.added",
        "note.created",
        "capture.meeting_note_pasted",
      ]),
    );
    expect(auditPayload).toContain("bodyLength");
    expect(auditPayload).not.toContain("Teams/Copilot raw pasted text");
    expect(auditPayload).not.toContain("Manual summary that must not");
    expect(auditPayload).not.toContain("peter@example.com");
  });

  it("prevents pasted capture and source references from crossing tenants", async () => {
    const firstContext = await createTenantContext("capture-first@example.com");
    const secondContext = await createTenantContext("capture-second@example.com");
    const firstMeeting = await createTenantMeeting(firstContext, {
      occurredAt: new Date("2026-04-24T10:00:00.000Z"),
      title: "First tenant meeting",
    });
    const secondPerson = await createTenantPerson(secondContext, {
      displayName: "Other tenant person",
    });
    const secondNote = await createTenantNote(secondContext, {
      body: "Other tenant note.",
      noteType: "MEETING",
    });

    await expect(
      createTenantPastedMeetingCapture(firstContext, {
        body: "Cross-tenant pasted text.",
        occurredAt: new Date("2026-04-24T10:00:00.000Z"),
        participantPersonIds: [secondPerson.id],
        sensitivity: "NORMAL",
        title: "Cross-tenant pasted capture",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);

    await expect(
      createTenantSourceReference(firstContext, {
        label: "invalid-cross-tenant-reference",
        sourceEntityId: secondNote.id,
        sourceEntityType: "NOTE",
        targetEntityId: firstMeeting.id,
        targetEntityType: "MEETING",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });
});
