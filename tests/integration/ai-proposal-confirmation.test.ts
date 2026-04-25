// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import {
  createTenantAIProposal,
  createTenantAIProposalItem,
  dismissTenantAIProposal,
  getTenantAIProposal,
  getTenantAIProposalProfile,
  getTenantAIProposalReviewSummary,
  listTenantAIProposals,
  reviewAllPendingTenantAIProposalItems,
  reviewTenantAIProposalItem,
} from "@/server/services/ai-proposals";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantMeeting } from "@/server/services/meetings";
import { createTenantNeed } from "@/server/services/needs";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

async function createProposalContext(email: string) {
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
    body: `${email} source body must not leak`,
    companyId: company.id,
    meetingId: meeting.id,
    noteType: "MEETING",
    personId: person.id,
    summary: `${email} safe note summary`,
  });
  const need = await createTenantNeed(context, {
    companyId: company.id,
    meetingId: meeting.id,
    needType: "REQUIREMENT",
    noteId: note.id,
    personId: person.id,
    title: `${email} Need`,
  });
  const proposal = await createTenantAIProposal(context, {
    confidence: 0.82,
    explanation: "Stored proposal for human review only.",
    proposalType: "NOTE_EXTRACTION",
    sourceMeetingId: meeting.id,
    sourceNoteId: note.id,
    targetEntityId: need.id,
    targetEntityType: "NEED",
    title: `${email} Proposal`,
  });

  return {
    company,
    context,
    meeting,
    need,
    note,
    person,
    proposal,
  };
}

describeWithDatabase("AI proposal confirmation workflow", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("lists and reads proposal profiles inside the active tenant", async () => {
    const first = await createProposalContext("first-proposal-review@example.com");
    const second = await createProposalContext(
      "second-proposal-review@example.com",
    );

    await createTenantAIProposalItem(first.context, {
      actionType: "UPDATE",
      aiProposalId: first.proposal.id,
      proposedPatch: {
        title: "Proposed title",
      },
      targetEntityId: first.need.id,
      targetEntityType: "NEED",
    });

    const profile = await getTenantAIProposalProfile(
      first.context,
      first.proposal.id,
    );

    expect(profile).toMatchObject({
      id: first.proposal.id,
      sourceMeetingId: first.meeting.id,
      sourceNoteId: first.note.id,
      tenantId: first.context.tenantId,
    });
    expect(profile?.targetContext?.label).toBe(first.need.title);
    await expect(listTenantAIProposals(first.context)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: first.proposal.id }),
      ]),
    );
    await expect(
      getTenantAIProposalProfile(second.context, first.proposal.id),
    ).resolves.toBeNull();
  });

  it("approves, rejects, and marks items as needing clarification", async () => {
    const data = await createProposalContext("proposal-item-status@example.com");
    const firstItem = await createTenantAIProposalItem(data.context, {
      actionType: "UPDATE",
      aiProposalId: data.proposal.id,
      proposedPatch: { title: "Approved concept" },
      targetEntityId: data.need.id,
      targetEntityType: "NEED",
    });
    const secondItem = await createTenantAIProposalItem(data.context, {
      actionType: "UPDATE",
      aiProposalId: data.proposal.id,
      proposedPatch: { title: "Rejected concept" },
      targetEntityId: data.need.id,
      targetEntityType: "NEED",
    });
    const thirdItem = await createTenantAIProposalItem(data.context, {
      actionType: "UPDATE",
      aiProposalId: data.proposal.id,
      proposedPatch: { title: "Unclear concept" },
      targetEntityId: data.need.id,
      targetEntityType: "NEED",
    });

    await reviewTenantAIProposalItem(data.context, {
      aiProposalId: data.proposal.id,
      aiProposalItemId: firstItem.id,
      nextStatus: "APPROVED",
    });
    await reviewTenantAIProposalItem(data.context, {
      aiProposalId: data.proposal.id,
      aiProposalItemId: secondItem.id,
      nextStatus: "REJECTED",
    });
    const result = await reviewTenantAIProposalItem(data.context, {
      aiProposalId: data.proposal.id,
      aiProposalItemId: thirdItem.id,
      nextStatus: "NEEDS_CLARIFICATION",
    });

    expect(result.proposal.status).toBe("PARTIALLY_APPROVED");
    await expect(
      prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              "ai_proposal.item_approved",
              "ai_proposal.item_rejected",
              "ai_proposal.item_needs_clarification",
            ],
          },
          tenantId: data.context.tenantId,
        },
      }),
    ).resolves.toHaveLength(3);
  });

  it("approves all and rejects all pending items", async () => {
    const approveData = await createProposalContext("approve-all@example.com");
    const rejectData = await createProposalContext("reject-all@example.com");

    await createTenantAIProposalItem(approveData.context, {
      actionType: "UPDATE",
      aiProposalId: approveData.proposal.id,
      proposedPatch: { title: "Approved one" },
      targetEntityId: approveData.need.id,
      targetEntityType: "NEED",
    });
    await createTenantAIProposalItem(approveData.context, {
      actionType: "UPDATE",
      aiProposalId: approveData.proposal.id,
      proposedPatch: { title: "Approved two" },
      targetEntityId: approveData.need.id,
      targetEntityType: "NEED",
    });
    await createTenantAIProposalItem(rejectData.context, {
      actionType: "UPDATE",
      aiProposalId: rejectData.proposal.id,
      proposedPatch: { title: "Rejected one" },
      targetEntityId: rejectData.need.id,
      targetEntityType: "NEED",
    });

    await expect(
      reviewAllPendingTenantAIProposalItems(approveData.context, {
        aiProposalId: approveData.proposal.id,
        nextStatus: "APPROVED",
      }),
    ).resolves.toMatchObject({ status: "APPROVED" });
    await expect(
      reviewAllPendingTenantAIProposalItems(rejectData.context, {
        aiProposalId: rejectData.proposal.id,
        nextStatus: "REJECTED",
      }),
    ).resolves.toMatchObject({ status: "REJECTED" });
  });

  it("dismisses proposals from active review", async () => {
    const data = await createProposalContext("dismiss-proposal@example.com");

    const dismissed = await dismissTenantAIProposal(data.context, data.proposal.id);

    expect(dismissed.status).toBe("DISMISSED");
    expect(dismissed.archivedAt).toBeInstanceOf(Date);
    await expect(
      getTenantAIProposal(data.context, data.proposal.id),
    ).resolves.toBeNull();
  });

  it("rejects cross-tenant item review attempts", async () => {
    const first = await createProposalContext("first-cross-proposal@example.com");
    const second = await createProposalContext(
      "second-cross-proposal@example.com",
    );
    const item = await createTenantAIProposalItem(first.context, {
      actionType: "UPDATE",
      aiProposalId: first.proposal.id,
      proposedPatch: { title: "Should stay pending" },
      targetEntityId: first.need.id,
      targetEntityType: "NEED",
    });

    await expect(
      reviewTenantAIProposalItem(second.context, {
        aiProposalId: first.proposal.id,
        aiProposalItemId: item.id,
        nextStatus: "APPROVED",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("does not mutate target records when proposal items are approved", async () => {
    const data = await createProposalContext("proposal-no-apply@example.com");
    const originalNeed = await prisma.need.findUniqueOrThrow({
      where: { id: data.need.id },
    });
    const item = await createTenantAIProposalItem(data.context, {
      actionType: "UPDATE",
      aiProposalId: data.proposal.id,
      proposedPatch: {
        title: "This must not be applied",
      },
      targetEntityId: data.need.id,
      targetEntityType: "NEED",
    });

    await reviewTenantAIProposalItem(data.context, {
      aiProposalId: data.proposal.id,
      aiProposalItemId: item.id,
      nextStatus: "APPROVED",
    });

    const unchangedNeed = await prisma.need.findUniqueOrThrow({
      where: { id: data.need.id },
    });

    expect(unchangedNeed.title).toBe(originalNeed.title);
  });

  it("writes safe audit logs without proposed patch or source text", async () => {
    const data = await createProposalContext("safe-audit-proposal@example.com");
    const item = await createTenantAIProposalItem(data.context, {
      actionType: "UPDATE",
      aiProposalId: data.proposal.id,
      proposedPatch: {
        apiKey: "sk-test-secret",
        description: "Sensitive proposed patch text",
      },
      targetEntityId: data.need.id,
      targetEntityType: "NEED",
    });

    await reviewTenantAIProposalItem(data.context, {
      aiProposalId: data.proposal.id,
      aiProposalItemId: item.id,
      nextStatus: "APPROVED",
    });

    const auditLog = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: "ai_proposal.item_approved",
        entityId: data.proposal.id,
        tenantId: data.context.tenantId,
      },
    });
    const metadata = JSON.stringify(auditLog.metadata);

    expect(metadata).toContain(item.id);
    expect(metadata).not.toContain("proposedPatch");
    expect(metadata).not.toContain("sk-test-secret");
    expect(metadata).not.toContain("Sensitive proposed patch text");
    expect(metadata).not.toContain("source body must not leak");
  });

  it("keeps Today proposal review summary tenant-scoped", async () => {
    const first = await createProposalContext("first-summary-proposal@example.com");
    const second = await createProposalContext(
      "second-summary-proposal@example.com",
    );
    const unclearItem = await createTenantAIProposalItem(first.context, {
      actionType: "UPDATE",
      aiProposalId: first.proposal.id,
      proposedPatch: { title: "Needs clarity" },
      targetEntityId: first.need.id,
      targetEntityType: "NEED",
    });

    await createTenantAIProposalItem(second.context, {
      actionType: "UPDATE",
      aiProposalId: second.proposal.id,
      proposedPatch: { title: "Other tenant" },
      targetEntityId: second.need.id,
      targetEntityType: "NEED",
    });
    await reviewTenantAIProposalItem(first.context, {
      aiProposalId: first.proposal.id,
      aiProposalItemId: unclearItem.id,
      nextStatus: "NEEDS_CLARIFICATION",
    });

    await expect(
      getTenantAIProposalReviewSummary(first.context),
    ).resolves.toMatchObject({
      itemsNeedingClarification: 1,
      pendingProposals: 1,
    });
  });
});
