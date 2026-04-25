// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { seedAIVoiceReadinessDemoData } from "@/prisma/seed-data/ai-voice-readiness";
import { prisma } from "@/server/db/prisma";
import { createAIProposalItem } from "@/server/repositories/ai-proposal-items";
import { createAIProposal } from "@/server/repositories/ai-proposals";
import { createVoiceMention } from "@/server/repositories/voice-mentions";
import { createVoiceNote } from "@/server/repositories/voice-notes";
import {
  createTenantAIProposal,
  createTenantAIProposalItem,
  getTenantAIProposal,
  getTenantAIProposalItem,
  listTenantAIProposals,
} from "@/server/services/ai-proposals";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantMeeting } from "@/server/services/meetings";
import { createTenantNeed } from "@/server/services/needs";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import {
  InvalidRelationshipEntityReferenceError,
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import { createTenantSourceReference } from "@/server/services/source-references";
import { createTenantTask } from "@/server/services/tasks";
import {
  createTenantVoiceMention,
  createTenantVoiceNote,
  getTenantVoiceMention,
  getTenantVoiceNote,
  listTenantVoiceMentions,
  listTenantVoiceNotes,
} from "@/server/services/voice-notes";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

async function createReadinessContext(email: string) {
  const context = await createTenantContext(email);
  const company = await createTenantCompany(context, {
    name: `${email} Company`,
  });
  const person = await createTenantPerson(context, {
    displayName: `${email} Person`,
  });
  const meeting = await createTenantMeeting(context, {
    title: `${email} Meeting`,
    primaryCompanyId: company.id,
  });
  const note = await createTenantNote(context, {
    body: `${email} note body`,
    companyId: company.id,
    meetingId: meeting.id,
    personId: person.id,
    noteType: "MEETING",
  });
  const need = await createTenantNeed(context, {
    title: `${email} Need`,
    needType: "REQUIREMENT",
    personId: person.id,
    companyId: company.id,
    meetingId: meeting.id,
    noteId: note.id,
  });
  const task = await createTenantTask(context, {
    title: `${email} Task`,
    personId: person.id,
    companyId: company.id,
    meetingId: meeting.id,
    noteId: note.id,
  });

  return {
    context,
    company,
    person,
    meeting,
    note,
    need,
    task,
  };
}

describeWithDatabase("AI proposal and voice readiness tenant isolation", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates and isolates tenant-scoped AI proposals", async () => {
    const first = await createReadinessContext("first-ai-proposal@example.com");
    const second = await createReadinessContext("second-ai-proposal@example.com");
    const proposal = await createTenantAIProposal(first.context, {
      title: "Propose need enrichment",
      proposalType: "NOTE_EXTRACTION",
      sourceNoteId: first.note.id,
      sourceMeetingId: first.meeting.id,
      targetEntityType: "NEED",
      targetEntityId: first.need.id,
      explanation: "Readiness-only proposal storage.",
      confidence: 0.8,
    });

    await expect(
      getTenantAIProposal(first.context, proposal.id),
    ).resolves.toMatchObject({
      id: proposal.id,
      tenantId: first.context.tenantId,
    });
    await expect(
      getTenantAIProposal(second.context, proposal.id),
    ).resolves.toBeNull();
    await expect(listTenantAIProposals(first.context)).resolves.toHaveLength(1);
    await expect(listTenantAIProposals(second.context)).resolves.toHaveLength(0);
  });

  it("stores AI proposal items without mutating target records", async () => {
    const first = await createReadinessContext("proposal-no-mutate@example.com");
    const originalNeed = await prisma.need.findUniqueOrThrow({
      where: { id: first.need.id },
    });
    const proposal = await createTenantAIProposal(first.context, {
      title: "Approved-looking readiness proposal",
      proposalType: "RELATIONSHIP_UPDATE",
      status: "APPROVED",
      targetEntityType: "NEED",
      targetEntityId: first.need.id,
    });
    const item = await createTenantAIProposalItem(first.context, {
      aiProposalId: proposal.id,
      actionType: "UPDATE",
      status: "APPROVED",
      targetEntityType: "NEED",
      targetEntityId: first.need.id,
      proposedPatch: {
        title: "This title must not be applied",
      },
      explanation: "Approval status is stored only in this readiness step.",
      confidence: 0.91,
    });
    const unchangedNeed = await prisma.need.findUniqueOrThrow({
      where: { id: first.need.id },
    });

    expect(item.status).toBe("APPROVED");
    expect(unchangedNeed.title).toBe(originalNeed.title);
  });

  it("creates and isolates tenant-scoped voice notes and mentions without audio", async () => {
    const first = await createReadinessContext("first-voice@example.com");
    const second = await createReadinessContext("second-voice@example.com");
    const voiceNote = await createTenantVoiceNote(first.context, {
      title: "Follow-up dictation readiness",
      status: "TRANSCRIBED",
      personId: first.person.id,
      companyId: first.company.id,
      meetingId: first.meeting.id,
      noteId: first.note.id,
      transcriptText: "Mention Peter and the MBSE follow-up.",
      transcriptConfidence: 0.83,
      audioRetentionStatus: "NOT_STORED",
    });
    const voiceMention = await createTenantVoiceMention(first.context, {
      voiceNoteId: voiceNote.id,
      mentionText: first.person.displayName,
      mentionType: "PERSON",
      resolvedEntityType: "PERSON",
      resolvedEntityId: first.person.id,
      confidence: 0.88,
      requiresUserConfirmation: false,
    });

    await expect(getTenantVoiceNote(first.context, voiceNote.id)).resolves.toMatchObject({
      id: voiceNote.id,
      audioStorageKey: null,
      audioRetentionStatus: "NOT_STORED",
    });
    await expect(getTenantVoiceNote(second.context, voiceNote.id)).resolves.toBeNull();
    await expect(
      getTenantVoiceMention(first.context, voiceMention.id),
    ).resolves.toMatchObject({ id: voiceMention.id });
    await expect(
      getTenantVoiceMention(second.context, voiceMention.id),
    ).resolves.toBeNull();
    await expect(listTenantVoiceNotes(first.context)).resolves.toHaveLength(1);
    await expect(
      listTenantVoiceMentions(first.context, voiceNote.id),
    ).resolves.toHaveLength(1);
  });

  it("validates polymorphic target pairs and tenant ownership", async () => {
    const first = await createReadinessContext("first-poly@example.com");
    const second = await createReadinessContext("second-poly@example.com");
    const voiceNote = await createTenantVoiceNote(first.context, {
      title: "Polymorphic validation voice note",
    });

    await expect(
      createTenantAIProposal(first.context, {
        title: "Invalid missing target id",
        targetEntityType: "NEED",
      }),
    ).rejects.toBeInstanceOf(InvalidRelationshipEntityReferenceError);
    await expect(
      createTenantAIProposal(first.context, {
        title: "Invalid missing target type",
        targetEntityId: first.need.id,
      }),
    ).rejects.toBeInstanceOf(InvalidRelationshipEntityReferenceError);
    await expect(
      createTenantAIProposal(first.context, {
        title: "Invalid cross-tenant target",
        targetEntityType: "NEED",
        targetEntityId: second.need.id,
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      createTenantVoiceMention(first.context, {
        voiceNoteId: voiceNote.id,
        mentionText: "Missing resolved id",
        mentionType: "PERSON",
        resolvedEntityType: "PERSON",
      }),
    ).rejects.toBeInstanceOf(InvalidRelationshipEntityReferenceError);
    await expect(
      createTenantVoiceMention(first.context, {
        voiceNoteId: voiceNote.id,
        mentionText: "Cross-tenant resolved person",
        mentionType: "PERSON",
        resolvedEntityType: "PERSON",
        resolvedEntityId: second.person.id,
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("rejects cross-tenant direct relations at the database layer", async () => {
    const first = await createReadinessContext("first-db-4b2@example.com");
    const second = await createReadinessContext("second-db-4b2@example.com");
    const secondProposal = await createTenantAIProposal(second.context, {
      title: "Other tenant proposal",
      sourceNoteId: second.note.id,
    });
    const secondVoiceNote = await createTenantVoiceNote(second.context, {
      title: "Other tenant voice note",
    });

    await expect(
      createVoiceNote({
        tenantId: first.context.tenantId,
        data: {
          title: "Invalid cross-tenant voice note",
          personId: second.person.id,
          createdByUserId: first.context.userId,
          updatedByUserId: first.context.userId,
        },
      }),
    ).rejects.toThrow();
    await expect(
      createAIProposal({
        tenantId: first.context.tenantId,
        data: {
          title: "Invalid cross-tenant AI proposal",
          sourceNoteId: second.note.id,
          createdByUserId: first.context.userId,
        },
      }),
    ).rejects.toThrow();
    await expect(
      createAIProposalItem({
        tenantId: first.context.tenantId,
        data: {
          aiProposalId: secondProposal.id,
          proposedPatch: {
            title: "Should fail",
          },
          createdByUserId: first.context.userId,
        },
      }),
    ).rejects.toThrow();
    await expect(
      createVoiceMention({
        tenantId: first.context.tenantId,
        data: {
          voiceNoteId: secondVoiceNote.id,
          mentionText: "Should fail",
          createdByUserId: first.context.userId,
          updatedByUserId: first.context.userId,
        },
      }),
    ).rejects.toThrow();
  });

  it("prevents SourceReference links across Step 4B-2 tenants", async () => {
    const first = await createReadinessContext("first-source-4b2@example.com");
    const second = await createReadinessContext("second-source-4b2@example.com");
    const voiceNote = await createTenantVoiceNote(first.context, {
      title: "Source reference voice note",
    });
    const aiProposal = await createTenantAIProposal(second.context, {
      title: "Other tenant proposal",
    });

    await expect(
      createTenantSourceReference(first.context, {
        sourceEntityType: "VOICE_NOTE",
        sourceEntityId: voiceNote.id,
        targetEntityType: "AI_PROPOSAL",
        targetEntityId: aiProposal.id,
        label: "invalid-cross-tenant-ai-voice-link",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("seeds Step 4B-2 demo data idempotently", async () => {
    await seedAIVoiceReadinessDemoData(prisma);
    await seedAIVoiceReadinessDemoData(prisma);

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: "demo-workspace" },
    });

    await expect(
      prisma.voiceNote.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(1);
    await expect(
      prisma.voiceMention.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(1);
    await expect(
      prisma.aIProposal.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(1);
    await expect(
      prisma.aIProposalItem.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(2);
    await expect(
      prisma.sourceReference.count({
        where: {
          tenantId: tenant.id,
          targetEntityType: {
            in: [
              "AI_PROPOSAL",
              "AI_PROPOSAL_ITEM",
              "VOICE_MENTION",
            ],
          },
        },
      }),
    ).resolves.toBe(4);
  });
});
