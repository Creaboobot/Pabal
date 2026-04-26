// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantMeeting } from "@/server/services/meetings";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  archiveTenantVoiceNote,
  createTenantVoiceNote,
  getTenantVoiceNote,
  getTenantVoiceNoteProfile,
  updateTenantVoiceNoteReview,
} from "@/server/services/voice-notes";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

async function createVoiceReviewContext(email: string) {
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
  });
  const voiceNote = await createTenantVoiceNote(context, {
    audioDurationSeconds: 12,
    audioMimeType: "audio/webm",
    audioRetentionStatus: "NOT_STORED",
    audioSizeBytes: 2048,
    rawAudioDeletedAt: new Date("2026-04-24T10:00:00.000Z"),
    status: "TRANSCRIBED",
    transcriptText: `${email} transcript text that must not leak`,
  });

  return {
    company,
    context,
    meeting,
    note,
    person,
    voiceNote,
  };
}

describeWithDatabase("voice note review workflow", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("updates title, reviewed transcript, and source context safely", async () => {
    const data = await createVoiceReviewContext("voice-review@example.com");
    const reviewedTranscript =
      "Reviewed transcript text that must not appear in audit metadata.";

    const updated = await updateTenantVoiceNoteReview(
      data.context,
      data.voiceNote.id,
      {
        companyId: data.company.id,
        editedTranscriptText: reviewedTranscript,
        meetingId: data.meeting.id,
        noteId: data.note.id,
        personId: data.person.id,
        title: "Reviewed voice note",
      },
    );

    expect(updated).toMatchObject({
      companyId: data.company.id,
      editedTranscriptText: reviewedTranscript,
      meetingId: data.meeting.id,
      noteId: data.note.id,
      personId: data.person.id,
      status: "REVIEWED",
      title: "Reviewed voice note",
    });

    const auditLog = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: "voice_note.updated",
        entityId: data.voiceNote.id,
        tenantId: data.context.tenantId,
      },
    });
    const metadata = JSON.stringify(auditLog.metadata);

    expect(metadata).toContain("editedTranscriptLength");
    expect(metadata).toContain(data.person.id);
    expect(metadata).not.toContain(reviewedTranscript);
    expect(metadata).not.toContain(data.voiceNote.transcriptText ?? "");
    await expect(prisma.voiceMention.count()).resolves.toBe(0);
    await expect(prisma.aIProposal.count()).resolves.toBe(0);
    await expect(prisma.aIProposalItem.count()).resolves.toBe(0);
  });

  it("archives a VoiceNote without hard deleting it", async () => {
    const data = await createVoiceReviewContext("voice-archive@example.com");

    const archived = await archiveTenantVoiceNote(
      data.context,
      data.voiceNote.id,
    );

    expect(archived.archivedAt).toBeInstanceOf(Date);
    await expect(
      getTenantVoiceNote(data.context, data.voiceNote.id),
    ).resolves.toBeNull();
    await expect(
      prisma.voiceNote.findUnique({
        where: {
          id: data.voiceNote.id,
        },
      }),
    ).resolves.toMatchObject({
      id: data.voiceNote.id,
      tenantId: data.context.tenantId,
    });

    const auditLog = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: "voice_note.archived",
        entityId: data.voiceNote.id,
        tenantId: data.context.tenantId,
      },
    });

    expect(JSON.stringify(auditLog.metadata)).not.toContain(
      data.voiceNote.transcriptText ?? "",
    );
  });

  it("keeps VoiceNote read, edit, archive, and source links tenant-scoped", async () => {
    const first = await createVoiceReviewContext(
      "first-voice-review@example.com",
    );
    const second = await createVoiceReviewContext(
      "second-voice-review@example.com",
    );

    await expect(
      getTenantVoiceNoteProfile(second.context, first.voiceNote.id),
    ).resolves.toBeNull();
    await expect(
      updateTenantVoiceNoteReview(second.context, first.voiceNote.id, {
        title: "Cross tenant update",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      archiveTenantVoiceNote(second.context, first.voiceNote.id),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      updateTenantVoiceNoteReview(first.context, first.voiceNote.id, {
        personId: second.person.id,
        title: "Invalid source link",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });
});
