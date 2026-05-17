// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createTenantAIProposal } from "@/server/services/ai-proposals";
import { createTenantCapability } from "@/server/services/capabilities";
import { createTenantCommitment } from "@/server/services/commitments";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantIntroductionSuggestion } from "@/server/services/introduction-suggestions";
import {
  createTenantMeeting,
  createTenantMeetingParticipant,
} from "@/server/services/meetings";
import { getTenantMeetingPrepBrief } from "@/server/services/meeting-prep";
import { createTenantNeed } from "@/server/services/needs";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import { createTenantSourceReference } from "@/server/services/source-references";
import { createTenantTask } from "@/server/services/tasks";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

async function createMeetingPrepScenario(email: string) {
  const context = await createTenantContext(email);
  const company = await createTenantCompany(context, {
    name: `${email} Primary Company`,
  });
  const participantCompany = await createTenantCompany(context, {
    name: `${email} Participant Company`,
  });
  const unrelatedCompany = await createTenantCompany(context, {
    name: `${email} Unrelated Company`,
  });
  const person = await createTenantPerson(context, {
    displayName: `${email} Known Participant`,
    email: `known-${email}`,
  });
  const targetPerson = await createTenantPerson(context, {
    displayName: `${email} Target Person`,
  });
  const snapshotLookalike = await createTenantPerson(context, {
    displayName: "Snapshot Guest",
    email: `snapshot-${email}`,
  });
  const meeting = await createTenantMeeting(context, {
    occurredAt: new Date("2026-04-24T10:00:00.000Z"),
    primaryCompanyId: company.id,
    title: `${email} Prep Meeting`,
  });

  await createTenantMeetingParticipant(context, {
    companyId: participantCompany.id,
    meetingId: meeting.id,
    participantRole: "HOST",
    personId: person.id,
  });
  const snapshotParticipant = await createTenantMeetingParticipant(context, {
    companyId: participantCompany.id,
    emailSnapshot: `snapshot-${email}`,
    meetingId: meeting.id,
    nameSnapshot: "Snapshot Guest",
    participantRole: "ATTENDEE",
  });
  const note = await createTenantNote(context, {
    body: "Full meeting note body that should only appear as a short preview.",
    companyId: company.id,
    meetingId: meeting.id,
    noteType: "MEETING",
    personId: person.id,
    summary: `${email} short prep note`,
  });

  await createTenantNote(context, {
    body: "Participant note body.",
    noteType: "PERSON",
    personId: person.id,
    summary: `${email} participant note`,
  });
  await createTenantNote(context, {
    body: "Company note body.",
    companyId: participantCompany.id,
    noteType: "COMPANY",
    summary: `${email} company note`,
  });
  const recentMeeting = await createTenantMeeting(context, {
    occurredAt: new Date("2026-04-10T10:00:00.000Z"),
    primaryCompanyId: participantCompany.id,
    title: `${email} Recent related meeting`,
  });

  await createTenantMeetingParticipant(context, {
    companyId: participantCompany.id,
    meetingId: recentMeeting.id,
    personId: person.id,
  });

  const task = await createTenantTask(context, {
    dueAt: new Date("2026-04-27T10:00:00.000Z"),
    meetingId: meeting.id,
    noteId: note.id,
    personId: person.id,
    priority: "HIGH",
    title: `${email} Open prep task`,
  });
  const commitment = await createTenantCommitment(context, {
    counterpartyCompanyId: company.id,
    counterpartyPersonId: person.id,
    dueAt: new Date("2026-04-28T10:00:00.000Z"),
    meetingId: meeting.id,
    noteId: note.id,
    ownerType: "ME",
    title: `${email} Open prep commitment`,
  });
  const need = await createTenantNeed(context, {
    companyId: company.id,
    meetingId: meeting.id,
    needType: "REQUIREMENT",
    noteId: note.id,
    personId: person.id,
    priority: "HIGH",
    title: `${email} Active need`,
  });
  const capability = await createTenantCapability(context, {
    capabilityType: "EXPERIENCE",
    companyId: participantCompany.id,
    noteId: note.id,
    personId: person.id,
    title: `${email} Active capability`,
  });
  const introduction = await createTenantIntroductionSuggestion(context, {
    capabilityId: capability.id,
    fromPersonId: person.id,
    needId: need.id,
    rationale: "Manual prep introduction rationale.",
    toPersonId: targetPerson.id,
  });
  const proposal = await createTenantAIProposal(context, {
    proposalType: "MEETING_EXTRACTION",
    sourceMeetingId: meeting.id,
    sourceNoteId: note.id,
    targetEntityId: person.id,
    targetEntityType: "PERSON",
    title: `${email} Review-only proposal`,
  });
  const sourceReference = await createTenantSourceReference(context, {
    label: "Meeting note provenance",
    sourceEntityId: note.id,
    sourceEntityType: "NOTE",
    targetEntityId: meeting.id,
    targetEntityType: "MEETING",
  });

  return {
    capability,
    commitment,
    company,
    context,
    introduction,
    meeting,
    need,
    note,
    participantCompany,
    person,
    proposal,
    recentMeeting,
    snapshotLookalike,
    snapshotParticipant,
    sourceReference,
    task,
    targetPerson,
    unrelatedCompany,
  };
}

describeWithDatabase("meeting prep brief", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("builds a tenant-scoped read-only brief for a tenant-owned meeting", async () => {
    const data = await createMeetingPrepScenario("brief-owned@example.com");

    const brief = await getTenantMeetingPrepBrief(
      data.context,
      data.meeting.id,
    );

    expect(brief).toMatchObject({
      meeting: {
        id: data.meeting.id,
        title: "brief-owned@example.com Prep Meeting",
      },
    });
    expect(brief?.participants.map((participant) => participant.id)).toContain(
      data.snapshotParticipant.id,
    );
    expect(
      brief?.participants.find(
        (participant) => participant.id === data.snapshotParticipant.id,
      ),
    ).toMatchObject({
      health: null,
      isKnownPerson: false,
      name: "Snapshot Guest",
      person: null,
    });
    expect(
      brief?.participants.find(
        (participant) => participant.person?.entityId === data.person.id,
      )?.health?.entityId,
    ).toBe(data.person.id);
    expect(brief?.companies.map((company) => company.id)).toEqual(
      expect.arrayContaining([data.company.id, data.participantCompany.id]),
    );
    expect(brief?.companies.map((company) => company.id)).not.toContain(
      data.unrelatedCompany.id,
    );
    expect(brief?.records.notes.map((note) => note.id)).toContain(
      data.note.id,
    );
    expect(brief?.records.recentMeetings.map((meeting) => meeting.id)).toContain(
      data.recentMeeting.id,
    );
    expect(brief?.records.tasks.map((task) => task.id)).toContain(data.task.id);
    expect(
      brief?.records.commitments.map((commitment) => commitment.id),
    ).toContain(data.commitment.id);
    expect(brief?.records.needs.map((need) => need.id)).toContain(
      data.need.id,
    );
    expect(
      brief?.records.capabilities.map((capability) => capability.id),
    ).toContain(data.capability.id);
    expect(brief?.records).not.toHaveProperty("introductions");
    expect(brief?.records.proposals).toEqual([
      expect.objectContaining({
        id: data.proposal.id,
        reviewOnly: true,
      }),
    ]);
    expect(
      brief?.records.sourceReferences.map((reference) => reference.id),
    ).toContain(data.sourceReference.id);
    expect(
      brief?.participants.map((participant) => participant.person?.entityId),
    ).not.toContain(data.snapshotLookalike.id);
  });

  it("returns null for cross-tenant meetings and excludes cross-tenant records", async () => {
    const first = await createMeetingPrepScenario("brief-first@example.com");
    const second = await createMeetingPrepScenario("brief-second@example.com");

    await expect(
      getTenantMeetingPrepBrief(second.context, first.meeting.id),
    ).resolves.toBeNull();

    const brief = await getTenantMeetingPrepBrief(
      first.context,
      first.meeting.id,
    );

    const serialized = JSON.stringify(brief);

    expect(serialized).toContain(first.meeting.id);
    expect(serialized).not.toContain(second.meeting.id);
    expect(serialized).not.toContain(second.person.id);
    expect(serialized).not.toContain(second.company.id);
    expect(serialized).not.toContain(second.note.id);
    expect(serialized).not.toContain(second.task.id);
    expect(serialized).not.toContain(second.commitment.id);
    expect(serialized).not.toContain(second.need.id);
    expect(serialized).not.toContain(second.capability.id);
    expect(serialized).not.toContain(second.introduction.id);
    expect(serialized).not.toContain(second.proposal.id);
  });

  it("does not mutate records, source references, or audit logs", async () => {
    const data = await createMeetingPrepScenario("brief-read-only@example.com");
    const before = {
      auditLogs: await prisma.auditLog.count({
        where: { tenantId: data.context.tenantId },
      }),
      meetings: await prisma.meeting.count({
        where: { tenantId: data.context.tenantId },
      }),
      sourceReferences: await prisma.sourceReference.count({
        where: { tenantId: data.context.tenantId },
      }),
      tasks: await prisma.task.count({
        where: { tenantId: data.context.tenantId },
      }),
    };

    await getTenantMeetingPrepBrief(data.context, data.meeting.id);

    await expect(
      prisma.auditLog.count({ where: { tenantId: data.context.tenantId } }),
    ).resolves.toBe(before.auditLogs);
    await expect(
      prisma.meeting.count({ where: { tenantId: data.context.tenantId } }),
    ).resolves.toBe(before.meetings);
    await expect(
      prisma.sourceReference.count({
        where: { tenantId: data.context.tenantId },
      }),
    ).resolves.toBe(before.sourceReferences);
    await expect(
      prisma.task.count({ where: { tenantId: data.context.tenantId } }),
    ).resolves.toBe(before.tasks);
  });
});
