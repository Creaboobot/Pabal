// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import {
  MockTranscriptStructuringProvider,
  type TranscriptStructuringProvider,
  type TranscriptStructuringResult,
} from "@/server/providers/transcript-structuring";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantMeeting } from "@/server/services/meetings";
import { createTenantPerson } from "@/server/services/people";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { createTenantVoiceNote } from "@/server/services/voice-notes";
import {
  structureTenantVoiceNoteIntoAIProposal,
  VoiceProposalStructuringError,
} from "@/server/services/voice-proposals";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

function structuredResult(
  item: Partial<TranscriptStructuringResult["items"][number]> = {},
): TranscriptStructuringResult {
  return {
    confidence: 0.84,
    explanation: "Structured for human review only.",
    items: [
      {
        actionType: "CREATE",
        confidence: 0.81,
        explanation: "Create a follow-up task for review.",
        needsClarification: false,
        proposedPatch: {
          fields: [
            {
              key: "title",
              sensitive: false,
              value: "Follow up next week",
              valueType: "STRING",
            },
          ],
          kind: "CREATE_TASK",
          linkedEntities: [],
          reviewOnly: true,
          sourceReferences: [],
        },
        targetEntityId: null,
        targetEntityType: null,
        targetLookupDomain: null,
        targetLookupEmail: null,
        targetLookupName: null,
        uncertaintyFlags: [],
        ...item,
      },
    ],
    proposalTitle: "Voice follow-up proposal",
    summary: "Review-only structured proposal from the voice transcript.",
  };
}

async function createVoiceProposalContext(email: string) {
  const context = await createTenantContext(email);
  const person = await createTenantPerson(context, {
    displayName: `${email} Person`,
    email: `${email}.person@example.com`,
  });
  const company = await createTenantCompany(context, {
    name: `${email} Company`,
    website: `https://${email.replace(/[^a-z0-9]/gi, "")}.example.com`,
  });
  const meeting = await createTenantMeeting(context, {
    primaryCompanyId: company.id,
    title: `${email} Meeting`,
  });
  const voiceNote = await createTenantVoiceNote(context, {
    audioDurationSeconds: 20,
    audioMimeType: "audio/webm",
    audioRetentionStatus: "NOT_STORED",
    audioSizeBytes: 4096,
    companyId: company.id,
    editedTranscriptText: "Edited transcript that should be used.",
    meetingId: meeting.id,
    personId: person.id,
    rawAudioDeletedAt: new Date("2026-04-24T12:00:00.000Z"),
    status: "REVIEWED",
    title: "Reviewed voice update",
    transcriptText: "Original transcript that should not be sent.",
  });

  return {
    company,
    context,
    meeting,
    person,
    voiceNote,
  };
}

describeWithDatabase("voice transcript to AIProposal structuring", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates a review-only AIProposal and AIProposalItems from a VoiceNote", async () => {
    const data = await createVoiceProposalContext("voice-proposal@example.com");
    const beforeCounts = {
      capabilities: await prisma.capability.count(),
      commitments: await prisma.commitment.count(),
      companies: await prisma.company.count(),
      introductions: await prisma.introductionSuggestion.count(),
      needs: await prisma.need.count(),
      people: await prisma.person.count(),
      tasks: await prisma.task.count(),
    };
    const provider = new MockTranscriptStructuringProvider(
      structuredResult({
        proposedPatch: {
          fields: [
            {
              key: "title",
              sensitive: false,
              value: "Follow up with person",
              valueType: "STRING",
            },
          ],
          kind: "CREATE_TASK",
          linkedEntities: [
            {
              entityId: data.person.id,
              entityType: "PERSON",
              label: data.person.displayName,
              role: "related_person",
            },
          ],
          reviewOnly: true,
          sourceReferences: [],
        },
      }),
    );

    const result = await structureTenantVoiceNoteIntoAIProposal(
      data.context,
      data.voiceNote.id,
      provider,
    );

    expect(result.reusedExistingProposal).toBe(false);
    expect(result.proposal).toMatchObject({
      proposalType: "VOICE_NOTE_EXTRACTION",
      sourceVoiceNoteId: data.voiceNote.id,
      status: "PENDING_REVIEW",
      tenantId: data.context.tenantId,
    });
    await expect(
      prisma.aIProposalItem.findMany({
        where: {
          aiProposalId: result.proposal.id,
          tenantId: data.context.tenantId,
        },
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        actionType: "CREATE",
        status: "PENDING_REVIEW",
        targetEntityId: null,
        targetEntityType: null,
      }),
    ]);
    await expect(prisma.voiceMention.count()).resolves.toBe(0);
    await expect(prisma.aIProposal.count()).resolves.toBe(1);
    await expect(prisma.aIProposalItem.count()).resolves.toBe(1);
    await expect(prisma.task.count()).resolves.toBe(beforeCounts.tasks);
    await expect(prisma.commitment.count()).resolves.toBe(
      beforeCounts.commitments,
    );
    await expect(prisma.need.count()).resolves.toBe(beforeCounts.needs);
    await expect(prisma.capability.count()).resolves.toBe(
      beforeCounts.capabilities,
    );
    await expect(prisma.introductionSuggestion.count()).resolves.toBe(
      beforeCounts.introductions,
    );
    await expect(prisma.person.count()).resolves.toBe(beforeCounts.people);
    await expect(prisma.company.count()).resolves.toBe(beforeCounts.companies);
  });

  it("uses edited transcript text before original transcript text", async () => {
    const data = await createVoiceProposalContext(
      "voice-edited-transcript@example.com",
    );
    let receivedTranscript = "";
    const provider = {
      name: "mock",
      async structureTranscript(input) {
        receivedTranscript = input.transcript;

        return structuredResult();
      },
    } satisfies TranscriptStructuringProvider;

    await structureTenantVoiceNoteIntoAIProposal(
      data.context,
      data.voiceNote.id,
      provider,
    );

    expect(receivedTranscript).toBe("Edited transcript that should be used.");
  });

  it("rejects VoiceNotes without a transcript", async () => {
    const context = await createTenantContext("voice-no-transcript@example.com");
    const voiceNote = await createTenantVoiceNote(context, {
      audioRetentionStatus: "NOT_STORED",
      status: "TRANSCRIBED",
    });

    await expect(
      structureTenantVoiceNoteIntoAIProposal(
        context,
        voiceNote.id,
        new MockTranscriptStructuringProvider(),
      ),
    ).rejects.toBeInstanceOf(VoiceProposalStructuringError);
    await expect(prisma.aIProposal.count()).resolves.toBe(0);
  });

  it("marks ambiguous entity mentions as needing clarification", async () => {
    const context = await createTenantContext("voice-ambiguous@example.com");
    await createTenantPerson(context, {
      displayName: "Alex Morgan",
      email: "alex.one@example.com",
    });
    await createTenantPerson(context, {
      displayName: "Alex Morgan",
      email: "alex.two@example.com",
    });
    const voiceNote = await createTenantVoiceNote(context, {
      audioRetentionStatus: "NOT_STORED",
      status: "TRANSCRIBED",
      transcriptText: "Alex Morgan needs a follow-up.",
    });
    const provider = new MockTranscriptStructuringProvider(
      structuredResult({
        actionType: "UPDATE",
        proposedPatch: {
          fields: [
            {
              key: "jobTitle",
              sensitive: false,
              value: "New role",
              valueType: "STRING",
            },
          ],
          kind: "UPDATE_PERSON",
          linkedEntities: [],
          reviewOnly: true,
          sourceReferences: [],
        },
        targetEntityId: null,
        targetEntityType: "PERSON",
        targetLookupName: "Alex Morgan",
      }),
    );

    const result = await structureTenantVoiceNoteIntoAIProposal(
      context,
      voiceNote.id,
      provider,
    );
    const item = await prisma.aIProposalItem.findFirstOrThrow({
      where: {
        aiProposalId: result.proposal.id,
        tenantId: context.tenantId,
      },
    });

    expect(item.status).toBe("NEEDS_CLARIFICATION");
    expect(item.targetEntityId).toBeNull();
    expect(item.targetEntityType).toBeNull();
  });

  it("keeps VoiceNote and provider target resolution tenant-scoped", async () => {
    const first = await createVoiceProposalContext(
      "first-voice-proposal@example.com",
    );
    const second = await createVoiceProposalContext(
      "second-voice-proposal@example.com",
    );
    const provider = new MockTranscriptStructuringProvider(
      structuredResult({
        actionType: "UPDATE",
        proposedPatch: {
          fields: [
            {
              key: "jobTitle",
              sensitive: false,
              value: "Cross tenant attempt",
              valueType: "STRING",
            },
          ],
          kind: "UPDATE_PERSON",
          linkedEntities: [],
          reviewOnly: true,
          sourceReferences: [],
        },
        targetEntityId: second.person.id,
        targetEntityType: "PERSON",
      }),
    );

    await expect(
      structureTenantVoiceNoteIntoAIProposal(
        second.context,
        first.voiceNote.id,
        provider,
      ),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);

    const result = await structureTenantVoiceNoteIntoAIProposal(
      first.context,
      first.voiceNote.id,
      provider,
    );
    const item = await prisma.aIProposalItem.findFirstOrThrow({
      where: {
        aiProposalId: result.proposal.id,
        tenantId: first.context.tenantId,
      },
    });

    expect(item.status).toBe("NEEDS_CLARIFICATION");
    expect(item.targetEntityId).toBeNull();
    expect(item.targetEntityType).toBeNull();
  });

  it("creates no proposal when provider output is invalid", async () => {
    const data = await createVoiceProposalContext("voice-invalid-ai@example.com");
    const provider = {
      name: "mock",
      async structureTranscript() {
        return {
          proposalTitle: "Invalid",
        } as unknown as TranscriptStructuringResult;
      },
    } satisfies TranscriptStructuringProvider;

    await expect(
      structureTenantVoiceNoteIntoAIProposal(
        data.context,
        data.voiceNote.id,
        provider,
      ),
    ).rejects.toMatchObject({
      code: "invalid_structured_output",
    });
    await expect(prisma.aIProposal.count()).resolves.toBe(0);
    await expect(prisma.aIProposalItem.count()).resolves.toBe(0);
  });

  it("returns an existing active proposal instead of creating a duplicate", async () => {
    const data = await createVoiceProposalContext("voice-duplicate@example.com");
    const provider = new MockTranscriptStructuringProvider(structuredResult());

    const first = await structureTenantVoiceNoteIntoAIProposal(
      data.context,
      data.voiceNote.id,
      provider,
    );
    const second = await structureTenantVoiceNoteIntoAIProposal(
      data.context,
      data.voiceNote.id,
      provider,
    );

    expect(second.reusedExistingProposal).toBe(true);
    expect(second.proposal.id).toBe(first.proposal.id);
    await expect(prisma.aIProposal.count()).resolves.toBe(1);
    await expect(prisma.aIProposalItem.count()).resolves.toBe(1);
  });

  it("writes safe audit logs without transcript, raw AI output, or proposedPatch", async () => {
    const data = await createVoiceProposalContext("voice-safe-audit@example.com");
    const provider = new MockTranscriptStructuringProvider(
      structuredResult({
        proposedPatch: {
          fields: [
            {
              key: "description",
              sensitive: true,
              value: "Sensitive proposed patch text",
              valueType: "STRING",
            },
          ],
          kind: "CREATE_NEED",
          linkedEntities: [],
          reviewOnly: true,
          sourceReferences: [],
        },
      }),
    );

    const result = await structureTenantVoiceNoteIntoAIProposal(
      data.context,
      data.voiceNote.id,
      provider,
    );
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityId: {
          in: [data.voiceNote.id, result.proposal.id],
        },
        tenantId: data.context.tenantId,
      },
    });
    const metadata = JSON.stringify(auditLogs.map((log) => log.metadata));

    expect(auditLogs.map((log) => log.action)).toEqual(
      expect.arrayContaining([
        "voice_note.proposal_requested",
        "ai_proposal.created_from_voice_note",
        "ai_proposal_item.created_from_voice_note",
      ]),
    );
    expect(metadata).toContain(result.proposal.id);
    expect(metadata).not.toContain("Edited transcript that should be used");
    expect(metadata).not.toContain("Original transcript that should not be sent");
    expect(metadata).not.toContain("Sensitive proposed patch text");
    expect(metadata).not.toContain("proposedPatch");
  });
});
