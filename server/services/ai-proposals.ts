import {
  type AIProposalItemStatus,
  type AIProposalStatus,
  type Prisma,
  type SourceEntityType,
} from "@prisma/client";

import {
  createAIProposalItem,
  countAIProposalItemsNeedingClarificationForTenant,
  findAIProposalItemForProposal,
  findAIProposalItemById,
  listAIProposalItemsForProposal,
  updateAIProposalItemReviewState,
  updatePendingAIProposalItemsForProposal,
} from "@/server/repositories/ai-proposal-items";
import {
  countPendingAIProposalsForTenant,
  createAIProposal,
  findAIProposalById,
  findAIProposalProfileById,
  listAIProposalsForTenant,
  updateAIProposalReviewState,
} from "@/server/repositories/ai-proposals";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  assertOptionalPolymorphicRelationshipBelongsToTenant,
  assertOptionalRelationshipEntityBelongsToTenant,
  assertRelationshipEntityBelongsToTenant,
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import { listTenantSourceReferencesForTarget } from "@/server/services/source-references";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

type AIProposalReviewableStatus = Extract<
  AIProposalItemStatus,
  "APPROVED" | "NEEDS_CLARIFICATION" | "REJECTED"
>;

type EntityDisplayContext = {
  available: boolean;
  entityId: string;
  entityType: SourceEntityType;
  href: string | null;
  label: string;
};

export async function createTenantAIProposal(
  context: TenantContext,
  data: Omit<
    Prisma.AIProposalUncheckedCreateInput,
    "tenantId" | "createdByUserId"
  >,
) {
  await requireTenantAccess(context);

  await Promise.all([
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "NOTE",
      entityId: data.sourceNoteId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "MEETING",
      entityId: data.sourceMeetingId,
    }),
    assertOptionalRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "VOICE_NOTE",
      entityId: data.sourceVoiceNoteId,
    }),
    assertOptionalPolymorphicRelationshipBelongsToTenant({
      tenantId: context.tenantId,
      entityType: data.targetEntityType,
      entityId: data.targetEntityId,
      label: "AIProposal target",
    }),
  ]);

  return createAIProposal({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
    },
  });
}

export async function getTenantAIProposal(
  context: TenantContext,
  aiProposalId: string,
) {
  await requireTenantAccess(context);

  return findAIProposalById({
    tenantId: context.tenantId,
    aiProposalId,
  });
}

async function resolveEntityDisplayContext(input: {
  tenantId: string;
  entityType: SourceEntityType | null | undefined;
  entityId: string | null | undefined;
}): Promise<EntityDisplayContext | null> {
  if (!input.entityType || !input.entityId) {
    return null;
  }

  const unresolved = {
    available: false,
    entityId: input.entityId,
    entityType: input.entityType,
    href: null,
    label: "Target unavailable",
  } satisfies EntityDisplayContext;

  switch (input.entityType) {
    case "PERSON": {
      const record = await prisma.person.findFirst({
        select: { displayName: true, id: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: `/people/${record.id}`,
            label: record.displayName,
          }
        : unresolved;
    }
    case "COMPANY": {
      const record = await prisma.company.findFirst({
        select: { id: true, name: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: `/people/companies/${record.id}`,
            label: record.name,
          }
        : unresolved;
    }
    case "COMPANY_AFFILIATION": {
      const record = await prisma.companyAffiliation.findFirst({
        include: {
          company: { select: { name: true } },
          person: { select: { displayName: true } },
        },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: `/people/${record.personId}`,
            label: `${record.person.displayName} at ${record.company.name}`,
          }
        : unresolved;
    }
    case "MEETING": {
      const record = await prisma.meeting.findFirst({
        select: { id: true, title: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: `/meetings/${record.id}`,
            label: record.title,
          }
        : unresolved;
    }
    case "MEETING_PARTICIPANT": {
      const record = await prisma.meetingParticipant.findFirst({
        include: {
          meeting: { select: { title: true } },
          person: { select: { displayName: true } },
        },
        where: {
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: `/meetings/${record.meetingId}`,
            label:
              record.person?.displayName ??
              record.nameSnapshot ??
              `Participant in ${record.meeting.title}`,
          }
        : unresolved;
    }
    case "NOTE": {
      const record = await prisma.note.findFirst({
        select: { id: true, noteType: true, summary: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: `/notes/${record.id}`,
            label: record.summary ?? `${record.noteType} note`,
          }
        : unresolved;
    }
    case "TASK": {
      const record = await prisma.task.findFirst({
        select: { id: true, title: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: `/tasks/${record.id}`,
            label: record.title,
          }
        : unresolved;
    }
    case "COMMITMENT": {
      const record = await prisma.commitment.findFirst({
        select: { id: true, title: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: `/commitments/${record.id}`,
            label: record.title,
          }
        : unresolved;
    }
    case "NEED": {
      const record = await prisma.need.findFirst({
        select: { id: true, title: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: null,
            label: record.title,
          }
        : unresolved;
    }
    case "CAPABILITY": {
      const record = await prisma.capability.findFirst({
        select: { id: true, title: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: null,
            label: record.title,
          }
        : unresolved;
    }
    case "INTRODUCTION_SUGGESTION": {
      const record = await prisma.introductionSuggestion.findFirst({
        select: { id: true, rationale: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: null,
            label:
              record.rationale.length > 80
                ? `${record.rationale.slice(0, 77)}...`
                : record.rationale,
          }
        : unresolved;
    }
    case "AI_PROPOSAL": {
      const record = await prisma.aIProposal.findFirst({
        select: { id: true, title: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: `/proposals/${record.id}`,
            label: record.title,
          }
        : unresolved;
    }
    case "AI_PROPOSAL_ITEM": {
      const record = await prisma.aIProposalItem.findFirst({
        select: { actionType: true, id: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: null,
            label: `${record.actionType} proposal item`,
          }
        : unresolved;
    }
    case "VOICE_NOTE": {
      const record = await prisma.voiceNote.findFirst({
        select: { id: true, status: true, title: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: null,
            label: record.title ?? `${record.status} voice note`,
          }
        : unresolved;
    }
    case "VOICE_MENTION": {
      const record = await prisma.voiceMention.findFirst({
        select: { id: true, mentionText: true },
        where: {
          archivedAt: null,
          id: input.entityId,
          tenantId: input.tenantId,
        },
      });

      return record
        ? {
            available: true,
            entityId: record.id,
            entityType: input.entityType,
            href: null,
            label: record.mentionText,
          }
        : unresolved;
    }
  }
}

export async function getTenantAIProposalProfile(
  context: TenantContext,
  aiProposalId: string,
) {
  await requireTenantAccess(context);

  const proposal = await findAIProposalProfileById({
    tenantId: context.tenantId,
    aiProposalId,
  });

  if (!proposal) {
    return null;
  }

  const [targetContext, sourceReferences, itemTargetContexts] =
    await Promise.all([
      resolveEntityDisplayContext({
        tenantId: context.tenantId,
        entityType: proposal.targetEntityType,
        entityId: proposal.targetEntityId,
      }),
      listTenantSourceReferencesForTarget(context, {
        targetEntityType: "AI_PROPOSAL",
        targetEntityId: proposal.id,
      }),
      Promise.all(
        proposal.items.map(async (item) => [
          item.id,
          await resolveEntityDisplayContext({
            tenantId: context.tenantId,
            entityType: item.targetEntityType,
            entityId: item.targetEntityId,
          }),
        ] as const),
      ),
    ]);

  return {
    ...proposal,
    itemTargetContexts: Object.fromEntries(itemTargetContexts) as Record<
      string,
      EntityDisplayContext | null
    >,
    sourceReferences,
    targetContext,
  };
}

export async function listTenantAIProposals(context: TenantContext) {
  await requireTenantAccess(context);

  return listAIProposalsForTenant(context.tenantId);
}

export async function getTenantAIProposalReviewSummary(
  context: TenantContext,
) {
  await requireTenantAccess(context);

  const [pendingProposals, itemsNeedingClarification] = await Promise.all([
    countPendingAIProposalsForTenant(context.tenantId),
    countAIProposalItemsNeedingClarificationForTenant(context.tenantId),
  ]);

  return {
    itemsNeedingClarification,
    pendingProposals,
  };
}

export async function createTenantAIProposalItem(
  context: TenantContext,
  data: Omit<
    Prisma.AIProposalItemUncheckedCreateInput,
    "tenantId" | "createdByUserId"
  >,
) {
  await requireTenantAccess(context);

  await Promise.all([
    assertRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "AI_PROPOSAL",
      entityId: data.aiProposalId,
    }),
    assertOptionalPolymorphicRelationshipBelongsToTenant({
      tenantId: context.tenantId,
      entityType: data.targetEntityType,
      entityId: data.targetEntityId,
      label: "AIProposalItem target",
    }),
  ]);

  return createAIProposalItem({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
    },
  });
}

export async function getTenantAIProposalItem(
  context: TenantContext,
  aiProposalItemId: string,
) {
  await requireTenantAccess(context);

  return findAIProposalItemById({
    tenantId: context.tenantId,
    aiProposalItemId,
  });
}

export async function listTenantAIProposalItems(
  context: TenantContext,
  aiProposalId: string,
) {
  await requireTenantAccess(context);
  await assertRelationshipEntityBelongsToTenant({
    tenantId: context.tenantId,
    entityType: "AI_PROPOSAL",
    entityId: aiProposalId,
  });

  return listAIProposalItemsForProposal({
    tenantId: context.tenantId,
    aiProposalId,
  });
}

export function rollupAIProposalStatus(
  items: Array<{ status: AIProposalItemStatus }>,
): AIProposalStatus {
  if (items.length === 0) {
    return "PENDING_REVIEW";
  }

  const statuses = items.map((item) => item.status);
  const allApproved = statuses.every((status) => status === "APPROVED");
  const allRejected = statuses.every((status) => status === "REJECTED");
  const allPending = statuses.every((status) => status === "PENDING_REVIEW");
  const allNeedsClarification = statuses.every(
    (status) => status === "NEEDS_CLARIFICATION",
  );
  const hasPending = statuses.includes("PENDING_REVIEW");
  const hasReviewed = statuses.some((status) => status !== "PENDING_REVIEW");

  if (allApproved) {
    return "APPROVED";
  }

  if (allRejected) {
    return "REJECTED";
  }

  if (allPending) {
    return "PENDING_REVIEW";
  }

  if (allNeedsClarification || (hasPending && hasReviewed)) {
    return "IN_REVIEW";
  }

  return "PARTIALLY_APPROVED";
}

function reviewAuditMetadata(input: {
  proposal: {
    id: string;
    proposalType: string;
    status: string;
  };
  item?: {
    actionType: string;
    confidence: number | null;
    id: string;
    status: string;
    targetEntityId: string | null;
    targetEntityType: SourceEntityType | null;
  };
  nextStatus?: string;
  previousStatus?: string;
  updatedItemCount?: number;
}) {
  return {
    actionType: input.item?.actionType,
    confidencePresent:
      input.item?.confidence === undefined
        ? undefined
        : input.item.confidence !== null,
    nextStatus: input.nextStatus,
    previousStatus: input.previousStatus,
    proposalId: input.proposal.id,
    proposalItemId: input.item?.id,
    proposalType: input.proposal.proposalType,
    statusTransition:
      input.previousStatus && input.nextStatus
        ? `${input.previousStatus}->${input.nextStatus}`
        : undefined,
    targetEntityId: input.item?.targetEntityId,
    targetEntityType: input.item?.targetEntityType,
    updatedItemCount: input.updatedItemCount,
  };
}

async function ensureReviewableProposal(input: {
  tenantId: string;
  aiProposalId: string;
  db: Prisma.TransactionClient;
}) {
  const proposal = await findAIProposalById(
    {
      tenantId: input.tenantId,
      aiProposalId: input.aiProposalId,
    },
    input.db,
  );

  if (!proposal) {
    throw new TenantScopedEntityNotFoundError(
      "AI_PROPOSAL",
      input.aiProposalId,
    );
  }

  return proposal;
}

export async function reviewTenantAIProposalItem(
  context: TenantContext,
  input: {
    aiProposalId: string;
    aiProposalItemId: string;
    nextStatus: AIProposalReviewableStatus;
  },
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (db) => {
    const proposal = await ensureReviewableProposal({
      aiProposalId: input.aiProposalId,
      db,
      tenantId: context.tenantId,
    });
    const item = await findAIProposalItemForProposal(
      {
        tenantId: context.tenantId,
        aiProposalId: input.aiProposalId,
        aiProposalItemId: input.aiProposalItemId,
      },
      db,
    );

    if (!item) {
      throw new TenantScopedEntityNotFoundError(
        "AI_PROPOSAL_ITEM",
        input.aiProposalItemId,
      );
    }

    const reviewedAt = new Date();
    const updatedItem = await updateAIProposalItemReviewState(
      {
        tenantId: context.tenantId,
        aiProposalItemId: item.id,
        data: {
          reviewedAt,
          reviewedByUserId: context.userId,
          status: input.nextStatus,
        },
      },
      db,
    );
    const items = await listAIProposalItemsForProposal(
      {
        tenantId: context.tenantId,
        aiProposalId: proposal.id,
      },
      db,
    );
    const proposalStatus = rollupAIProposalStatus(items);
    const updatedProposal = await updateAIProposalReviewState(
      {
        tenantId: context.tenantId,
        aiProposalId: proposal.id,
        data: {
          reviewedAt,
          reviewedByUserId: context.userId,
          status: proposalStatus,
        },
      },
      db,
    );
    const auditAction =
      input.nextStatus === "APPROVED"
        ? "ai_proposal.item_approved"
        : input.nextStatus === "REJECTED"
          ? "ai_proposal.item_rejected"
          : "ai_proposal.item_needs_clarification";

    await writeAuditLog(
      {
        action: auditAction,
        actorUserId: context.userId,
        entityId: proposal.id,
        entityType: "AIProposal",
        metadata: reviewAuditMetadata({
          item: updatedItem,
          nextStatus: input.nextStatus,
          previousStatus: item.status,
          proposal,
        }),
        tenantId: context.tenantId,
      },
      db,
    );

    return {
      item: updatedItem,
      proposal: updatedProposal,
    };
  });
}

export async function reviewAllPendingTenantAIProposalItems(
  context: TenantContext,
  input: {
    aiProposalId: string;
    nextStatus: Extract<AIProposalReviewableStatus, "APPROVED" | "REJECTED">;
  },
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (db) => {
    const proposal = await ensureReviewableProposal({
      aiProposalId: input.aiProposalId,
      db,
      tenantId: context.tenantId,
    });
    const reviewedAt = new Date();
    const updated = await updatePendingAIProposalItemsForProposal(
      {
        tenantId: context.tenantId,
        aiProposalId: proposal.id,
        data: {
          reviewedAt,
          reviewedByUserId: context.userId,
          status: input.nextStatus,
        },
      },
      db,
    );
    const items = await listAIProposalItemsForProposal(
      {
        tenantId: context.tenantId,
        aiProposalId: proposal.id,
      },
      db,
    );
    const proposalStatus = rollupAIProposalStatus(items);
    const updatedProposal = await updateAIProposalReviewState(
      {
        tenantId: context.tenantId,
        aiProposalId: proposal.id,
        data: {
          reviewedAt,
          reviewedByUserId: context.userId,
          status: proposalStatus,
        },
      },
      db,
    );

    await writeAuditLog(
      {
        action:
          input.nextStatus === "APPROVED"
            ? "ai_proposal.approved_all"
            : "ai_proposal.rejected_all",
        actorUserId: context.userId,
        entityId: proposal.id,
        entityType: "AIProposal",
        metadata: reviewAuditMetadata({
          nextStatus: proposalStatus,
          previousStatus: proposal.status,
          proposal,
          updatedItemCount: updated.count,
        }),
        tenantId: context.tenantId,
      },
      db,
    );

    return updatedProposal;
  });
}

export async function dismissTenantAIProposal(
  context: TenantContext,
  aiProposalId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (db) => {
    const proposal = await ensureReviewableProposal({
      aiProposalId,
      db,
      tenantId: context.tenantId,
    });
    const reviewedAt = new Date();
    const dismissed = await updateAIProposalReviewState(
      {
        tenantId: context.tenantId,
        aiProposalId: proposal.id,
        data: {
          archivedAt: reviewedAt,
          reviewedAt,
          reviewedByUserId: context.userId,
          status: "DISMISSED",
        },
      },
      db,
    );

    await writeAuditLog(
      {
        action: "ai_proposal.dismissed",
        actorUserId: context.userId,
        entityId: proposal.id,
        entityType: "AIProposal",
        metadata: reviewAuditMetadata({
          nextStatus: "DISMISSED",
          previousStatus: proposal.status,
          proposal,
        }),
        tenantId: context.tenantId,
      },
      db,
    );

    return dismissed;
  });
}
