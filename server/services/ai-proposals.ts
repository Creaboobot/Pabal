import { type Prisma } from "@prisma/client";

import {
  createAIProposalItem,
  findAIProposalItemById,
  listAIProposalItemsForProposal,
} from "@/server/repositories/ai-proposal-items";
import {
  createAIProposal,
  findAIProposalById,
  listAIProposalsForTenant,
} from "@/server/repositories/ai-proposals";
import {
  assertOptionalPolymorphicRelationshipBelongsToTenant,
  assertOptionalRelationshipEntityBelongsToTenant,
  assertRelationshipEntityBelongsToTenant,
} from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

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

export async function listTenantAIProposals(context: TenantContext) {
  await requireTenantAccess(context);

  return listAIProposalsForTenant(context.tenantId);
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
