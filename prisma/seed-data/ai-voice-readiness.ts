import { type PrismaClient, type Prisma } from "@prisma/client";

import { seedActionIntelligenceDemoData } from "./action-intelligence";

type SeedClient = PrismaClient | Prisma.TransactionClient;

export async function seedAIVoiceReadinessDemoData(db: SeedClient) {
  const { tenantId, userId } = await seedActionIntelligenceDemoData(db);

  const voiceNote = await db.voiceNote.upsert({
    where: { id: "demo-voice-note-mbse-follow-up" },
    create: {
      id: "demo-voice-note-mbse-follow-up",
      tenantId,
      status: "TRANSCRIBED",
      title: "Post-meeting MBSE follow-up note",
      personId: "demo-person-peter",
      companyId: "demo-company-vestas-energy",
      meetingId: "demo-meeting-mbse-readiness",
      noteId: "demo-note-meeting-mbse",
      transcriptText:
        "Peter still needs practical examples for the MBSE agenda. Follow up with a concise outline and mention Laura can help shape it.",
      editedTranscriptText:
        "Peter needs practical MBSE examples. Follow up with an outline and consider Laura's input.",
      language: "en",
      transcriptConfidence: 0.82,
      audioRetentionStatus: "NOT_STORED",
      createdByUserId: userId,
      updatedByUserId: userId,
    },
    update: {
      status: "TRANSCRIBED",
      title: "Post-meeting MBSE follow-up note",
      transcriptText:
        "Peter still needs practical examples for the MBSE agenda. Follow up with a concise outline and mention Laura can help shape it.",
      editedTranscriptText:
        "Peter needs practical MBSE examples. Follow up with an outline and consider Laura's input.",
      language: "en",
      transcriptConfidence: 0.82,
      audioRetentionStatus: "NOT_STORED",
      updatedByUserId: userId,
    },
  });

  const voiceMention = await db.voiceMention.upsert({
    where: { id: "demo-voice-mention-peter" },
    create: {
      id: "demo-voice-mention-peter",
      tenantId,
      voiceNoteId: voiceNote.id,
      mentionText: "Peter",
      mentionType: "PERSON",
      startChar: 0,
      endChar: 5,
      resolvedEntityType: "PERSON",
      resolvedEntityId: "demo-person-peter",
      confidence: 0.9,
      requiresUserConfirmation: false,
      confirmedByUserId: userId,
      confirmedAt: new Date("2026-02-03T12:00:00.000Z"),
      createdByUserId: userId,
      updatedByUserId: userId,
    },
    update: {
      mentionText: "Peter",
      mentionType: "PERSON",
      resolvedEntityType: "PERSON",
      resolvedEntityId: "demo-person-peter",
      confidence: 0.9,
      requiresUserConfirmation: false,
      updatedByUserId: userId,
    },
  });

  const aiProposal = await db.aIProposal.upsert({
    where: { id: "demo-ai-proposal-mbse-readiness" },
    create: {
      id: "demo-ai-proposal-mbse-readiness",
      tenantId,
      proposalType: "VOICE_NOTE_EXTRACTION",
      status: "PENDING_REVIEW",
      sourceNoteId: "demo-note-meeting-mbse",
      sourceMeetingId: "demo-meeting-mbse-readiness",
      sourceVoiceNoteId: voiceNote.id,
      targetEntityType: "NEED",
      targetEntityId: "demo-need-mbse-practical-training",
      title: "Proposed MBSE follow-up updates",
      summary:
        "Readiness record showing how a future AI extraction could propose updates from a voice note.",
      explanation:
        "The voice note reiterates Peter's need and suggests a follow-up, but this seed does not apply any mutation.",
      confidence: 0.81,
      createdByUserId: userId,
    },
    update: {
      proposalType: "VOICE_NOTE_EXTRACTION",
      status: "PENDING_REVIEW",
      title: "Proposed MBSE follow-up updates",
      summary:
        "Readiness record showing how a future AI extraction could propose updates from a voice note.",
      explanation:
        "The voice note reiterates Peter's need and suggests a follow-up, but this seed does not apply any mutation.",
      confidence: 0.81,
    },
  });

  const needProposalItem = await db.aIProposalItem.upsert({
    where: { id: "demo-ai-proposal-item-update-need" },
    create: {
      id: "demo-ai-proposal-item-update-need",
      tenantId,
      aiProposalId: aiProposal.id,
      actionType: "UPDATE",
      status: "PENDING_REVIEW",
      targetEntityType: "NEED",
      targetEntityId: "demo-need-mbse-practical-training",
      proposedPatch: {
        description:
          "Peter needs practical MBSE training examples and a concise agenda outline.",
      },
      explanation:
        "The future proposal would update the need description only after user review.",
      confidence: 0.81,
      createdByUserId: userId,
    },
    update: {
      actionType: "UPDATE",
      status: "PENDING_REVIEW",
      proposedPatch: {
        description:
          "Peter needs practical MBSE training examples and a concise agenda outline.",
      },
      explanation:
        "The future proposal would update the need description only after user review.",
      confidence: 0.81,
    },
  });

  const taskProposalItem = await db.aIProposalItem.upsert({
    where: { id: "demo-ai-proposal-item-update-task" },
    create: {
      id: "demo-ai-proposal-item-update-task",
      tenantId,
      aiProposalId: aiProposal.id,
      actionType: "UPDATE",
      status: "PENDING_REVIEW",
      targetEntityType: "TASK",
      targetEntityId: "demo-task-follow-up-peter-mbse-agenda",
      proposedPatch: {
        whyNowRationale:
          "The voice note confirms Peter still needs a practical agenda outline.",
      },
      explanation:
        "The future proposal would enrich the task rationale only after approval.",
      confidence: 0.79,
      createdByUserId: userId,
    },
    update: {
      actionType: "UPDATE",
      status: "PENDING_REVIEW",
      proposedPatch: {
        whyNowRationale:
          "The voice note confirms Peter still needs a practical agenda outline.",
      },
      explanation:
        "The future proposal would enrich the task rationale only after approval.",
      confidence: 0.79,
    },
  });

  const sourceReferences = [
    {
      id: "demo-source-voice-note-to-voice-mention",
      sourceEntityType: "VOICE_NOTE" as const,
      sourceEntityId: voiceNote.id,
      targetEntityType: "VOICE_MENTION" as const,
      targetEntityId: voiceMention.id,
      label: "voice-mention-context",
      reason: "The mention was detected in the readiness transcript text.",
      confidence: 0.9,
    },
    {
      id: "demo-source-voice-note-to-ai-proposal",
      sourceEntityType: "VOICE_NOTE" as const,
      sourceEntityId: voiceNote.id,
      targetEntityType: "AI_PROPOSAL" as const,
      targetEntityId: aiProposal.id,
      label: "proposal-source",
      reason: "The readiness proposal is grounded in the voice note transcript.",
      confidence: 0.81,
    },
    {
      id: "demo-source-ai-proposal-to-need-item",
      sourceEntityType: "AI_PROPOSAL" as const,
      sourceEntityId: aiProposal.id,
      targetEntityType: "AI_PROPOSAL_ITEM" as const,
      targetEntityId: needProposalItem.id,
      label: "proposal-item",
      reason: "The proposal item is independently reviewable.",
      confidence: 0.81,
    },
    {
      id: "demo-source-ai-proposal-to-task-item",
      sourceEntityType: "AI_PROPOSAL" as const,
      sourceEntityId: aiProposal.id,
      targetEntityType: "AI_PROPOSAL_ITEM" as const,
      targetEntityId: taskProposalItem.id,
      label: "proposal-item",
      reason: "The proposal item is independently reviewable.",
      confidence: 0.79,
    },
  ];

  await Promise.all(
    sourceReferences.map((sourceReference) =>
      db.sourceReference.upsert({
        where: { id: sourceReference.id },
        create: {
          ...sourceReference,
          tenantId,
          createdByUserId: userId,
        },
        update: {
          label: sourceReference.label,
          reason: sourceReference.reason,
          confidence: sourceReference.confidence,
        },
      }),
    ),
  );

  return {
    tenantId,
    userId,
  };
}
