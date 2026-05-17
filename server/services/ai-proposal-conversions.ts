import {
  type Prisma,
  type SourceEntityType,
  type TaskPriority,
  type TaskType,
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { findAIProposalItemForProposal } from "@/server/repositories/ai-proposal-items";
import { findAIProposalById } from "@/server/repositories/ai-proposals";
import { createMeeting, findMeetingById } from "@/server/repositories/meetings";
import {
  createSourceReference,
  listSourceReferencesForSource,
} from "@/server/repositories/source-references";
import { createTask, findTaskById } from "@/server/repositories/tasks";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  assertOptionalRelationshipEntityBelongsToTenant,
  assertRelationshipEntityBelongsToTenant,
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";
import type { TaskMutationInput } from "@/server/services/tasks";

type AIProposalConversionClient = Prisma.TransactionClient;

type ProposalItemConversionTargetType = Extract<
  SourceEntityType,
  "MEETING" | "TASK"
>;

type AIProposalRecord = NonNullable<Awaited<ReturnType<typeof findAIProposalById>>>;
type AIProposalItemRecord = NonNullable<
  Awaited<ReturnType<typeof findAIProposalItemForProposal>>
>;

type MeetingConversionInput = {
  endedAt?: Date | null;
  location?: string | null;
  occurredAt?: Date | null;
  primaryCompanyId?: string | null;
  sourceType?: "MANUAL" | "TEAMS_COPILOT_PASTE" | "LINKEDIN_USER_PROVIDED";
  summary?: string | null;
  title: string;
};

export type AIProposalItemConversionTarget = {
  href: string;
  id: string;
  label: string;
};

export type AIProposalItemConversionTargets = {
  meeting: AIProposalItemConversionTarget | null;
  task: AIProposalItemConversionTarget | null;
};

export type AIProposalItemTaskConversionDraft = {
  conversionTargets: AIProposalItemConversionTargets;
  initialValues: {
    commitmentId: string | null;
    companyId: string | null;
    description: string | null;
    dueAt: Date | null;
    meetingId: string | null;
    noteId: string | null;
    personId: string | null;
    priority: TaskPriority;
    sourceAIProposalId: string;
    sourceAIProposalItemId: string;
    taskType: TaskType;
    title: string;
    whyNowRationale: string | null;
  };
};

export type AIProposalItemMeetingConversionDraft = {
  conversionTargets: AIProposalItemConversionTargets;
  initialValues: {
    occurredAt: Date | null;
    primaryCompanyId: string | null;
    sourceAIProposalId: string;
    sourceAIProposalItemId: string;
    summary: string | null;
    title: string;
  };
};

type ProposalItemConversionSource = {
  aiProposalId: string;
  aiProposalItemId: string;
};

const DIRECT_TEXT_MAX_LENGTH = 4000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, maxLength = DIRECT_TEXT_MAX_LENGTH) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
}

function patchValue(proposedPatch: unknown, key: string) {
  if (!isRecord(proposedPatch)) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(proposedPatch, key)) {
    return proposedPatch[key];
  }

  const fields = proposedPatch.fields;

  if (!Array.isArray(fields)) {
    return null;
  }

  const field = fields.find(
    (entry) =>
      isRecord(entry) && entry.key === key && entry.sensitive !== true,
  );

  return isRecord(field) ? field.value : null;
}

function patchText(
  proposedPatch: unknown,
  key: string,
  maxLength = DIRECT_TEXT_MAX_LENGTH,
) {
  return cleanText(patchValue(proposedPatch, key), maxLength);
}

function patchDate(proposedPatch: unknown, key: string) {
  const value = patchValue(proposedPatch, key);

  if (typeof value !== "string") {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}(?:T|\s|$)/.test(value.trim())) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

function fallbackText(
  item: Pick<AIProposalItemRecord, "explanation">,
  proposal: Pick<AIProposalRecord, "title">,
  maxLength: number,
) {
  return cleanText(item.explanation, maxLength) ?? proposal.title.slice(0, maxLength);
}

function taskChangedFields(data: TaskMutationInput) {
  const fields: Array<keyof TaskMutationInput> = [
    "commitmentId",
    "companyId",
    "description",
    "dueAt",
    "meetingId",
    "noteId",
    "personId",
    "priority",
    "taskType",
    "title",
    "whyNowRationale",
  ];

  return fields.filter((field) => data[field] !== null && data[field] !== undefined);
}

function meetingChangedFields(data: MeetingConversionInput) {
  const fields: Array<keyof MeetingConversionInput> = [
    "endedAt",
    "location",
    "occurredAt",
    "primaryCompanyId",
    "sourceType",
    "summary",
    "title",
  ];

  return fields.filter((field) => data[field] !== null && data[field] !== undefined);
}

async function loadProposalItemForConversion(
  context: TenantContext,
  input: ProposalItemConversionSource,
  db: AIProposalConversionClient,
) {
  const proposal = await findAIProposalById(
    {
      tenantId: context.tenantId,
      aiProposalId: input.aiProposalId,
    },
    db,
  );

  if (!proposal) {
    throw new TenantScopedEntityNotFoundError(
      "AI_PROPOSAL",
      input.aiProposalId,
    );
  }

  const item = await findAIProposalItemForProposal(
    {
      tenantId: context.tenantId,
      aiProposalId: proposal.id,
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

  return { item, proposal };
}

function targetCandidateForType(
  item: Pick<AIProposalItemRecord, "targetEntityId" | "targetEntityType">,
  proposal: Pick<AIProposalRecord, "targetEntityId" | "targetEntityType">,
  entityType: SourceEntityType,
) {
  if (item.targetEntityType === entityType && item.targetEntityId) {
    return item.targetEntityId;
  }

  if (proposal.targetEntityType === entityType && proposal.targetEntityId) {
    return proposal.targetEntityId;
  }

  return null;
}

async function validatedOptionalId(
  context: TenantContext,
  entityType: SourceEntityType,
  entityId: string | null | undefined,
  db?: Prisma.TransactionClient,
) {
  await assertOptionalRelationshipEntityBelongsToTenant(
    {
      tenantId: context.tenantId,
      entityId,
      entityType,
    },
    db,
  );

  return entityId ?? null;
}

async function taskContextDefaults(
  context: TenantContext,
  proposal: AIProposalRecord,
  item: AIProposalItemRecord,
  db?: Prisma.TransactionClient,
) {
  const [personId, companyId, targetMeetingId, targetNoteId, sourceMeetingId, sourceNoteId] =
    await Promise.all([
      validatedOptionalId(
        context,
        "PERSON",
        targetCandidateForType(item, proposal, "PERSON"),
        db,
      ),
      validatedOptionalId(
        context,
        "COMPANY",
        targetCandidateForType(item, proposal, "COMPANY"),
        db,
      ),
      validatedOptionalId(
        context,
        "MEETING",
        targetCandidateForType(item, proposal, "MEETING"),
        db,
      ),
      validatedOptionalId(
        context,
        "NOTE",
        targetCandidateForType(item, proposal, "NOTE"),
        db,
      ),
      validatedOptionalId(context, "MEETING", proposal.sourceMeetingId, db),
      validatedOptionalId(context, "NOTE", proposal.sourceNoteId, db),
    ]);

  return {
    companyId,
    meetingId: targetMeetingId ?? sourceMeetingId,
    noteId: targetNoteId ?? sourceNoteId,
    personId,
  };
}

async function meetingContextDefaults(
  context: TenantContext,
  proposal: AIProposalRecord,
  item: AIProposalItemRecord,
  db?: Prisma.TransactionClient,
) {
  const primaryCompanyId = targetCandidateForType(item, proposal, "COMPANY");

  return {
    primaryCompanyId: await validatedOptionalId(
      context,
      "COMPANY",
      primaryCompanyId,
      db,
    ),
  };
}

async function validateTaskLinks(
  context: TenantContext,
  data: TaskMutationInput,
  db: Prisma.TransactionClient,
) {
  await Promise.all([
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityId: data.personId,
        entityType: "PERSON",
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityId: data.companyId,
        entityType: "COMPANY",
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityId: data.meetingId,
        entityType: "MEETING",
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityId: data.noteId,
        entityType: "NOTE",
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityId: data.commitmentId,
        entityType: "COMMITMENT",
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityId: data.introductionSuggestionId,
        entityType: "INTRODUCTION_SUGGESTION",
      },
      db,
    ),
  ]);
}

async function validateMeetingLinks(
  context: TenantContext,
  data: MeetingConversionInput,
  db: Prisma.TransactionClient,
) {
  await assertOptionalRelationshipEntityBelongsToTenant(
    {
      tenantId: context.tenantId,
      entityId: data.primaryCompanyId,
      entityType: "COMPANY",
    },
    db,
  );
}

async function conversionTargetsForItem(
  context: TenantContext,
  aiProposalItemId: string,
  db?: Prisma.TransactionClient,
): Promise<AIProposalItemConversionTargets> {
  const references = await listSourceReferencesForSource(
    {
      tenantId: context.tenantId,
      sourceEntityId: aiProposalItemId,
      sourceEntityType: "AI_PROPOSAL_ITEM",
    },
    db,
  );
  const taskReference = references.find(
    (reference) => reference.targetEntityType === "TASK",
  );
  const meetingReference = references.find(
    (reference) => reference.targetEntityType === "MEETING",
  );

  const [task, meeting] = await Promise.all([
    taskReference
      ? findTaskById(
          {
            tenantId: context.tenantId,
            taskId: taskReference.targetEntityId,
          },
          db,
        )
      : Promise.resolve(null),
    meetingReference
      ? findMeetingById(
          {
            tenantId: context.tenantId,
            meetingId: meetingReference.targetEntityId,
          },
          db,
        )
      : Promise.resolve(null),
  ]);

  return {
    meeting: meeting
      ? {
          href: `/meetings/${meeting.id}`,
          id: meeting.id,
          label: meeting.title,
        }
      : null,
    task: task
      ? {
          href: `/tasks/${task.id}`,
          id: task.id,
          label: task.title,
        }
      : null,
  };
}

async function existingConversionRecord(
  context: TenantContext,
  aiProposalItemId: string,
  targetEntityType: ProposalItemConversionTargetType,
  db: Prisma.TransactionClient,
) {
  const targets = await conversionTargetsForItem(context, aiProposalItemId, db);

  return targetEntityType === "TASK" ? targets.task : targets.meeting;
}

async function createConversionSourceReference(
  context: TenantContext,
  input: {
    aiProposalItemId: string;
    confidence: number | null;
    targetEntityId: string;
    targetEntityType: ProposalItemConversionTargetType;
  },
  db: Prisma.TransactionClient,
) {
  const existing = await listSourceReferencesForSource(
    {
      tenantId: context.tenantId,
      sourceEntityId: input.aiProposalItemId,
      sourceEntityType: "AI_PROPOSAL_ITEM",
    },
    db,
  );
  const duplicate = existing.find(
    (reference) =>
      reference.targetEntityId === input.targetEntityId &&
      reference.targetEntityType === input.targetEntityType,
  );

  if (duplicate) {
    return duplicate;
  }

  return createSourceReference(
    {
      tenantId: context.tenantId,
      data: {
        confidence: input.confidence,
        createdByUserId: context.userId,
        label: "Suggested update conversion",
        reason: "User confirmed conversion from a suggested update.",
        sourceEntityId: input.aiProposalItemId,
        sourceEntityType: "AI_PROPOSAL_ITEM",
        targetEntityId: input.targetEntityId,
        targetEntityType: input.targetEntityType,
      },
    },
    db,
  );
}

export async function listTenantAIProposalItemConversionTargets(
  context: TenantContext,
  aiProposalItemId: string,
) {
  await requireTenantAccess(context);
  await assertRelationshipEntityBelongsToTenant({
    tenantId: context.tenantId,
    entityId: aiProposalItemId,
    entityType: "AI_PROPOSAL_ITEM",
  });

  return conversionTargetsForItem(context, aiProposalItemId);
}

export async function getTenantAIProposalItemTaskConversionDraft(
  context: TenantContext,
  input: ProposalItemConversionSource,
): Promise<AIProposalItemTaskConversionDraft> {
  await requireTenantAccess(context);

  const { item, proposal } = await prisma.$transaction((db) =>
    loadProposalItemForConversion(context, input, db),
  );
  const [contextDefaults, conversionTargets] = await Promise.all([
    taskContextDefaults(context, proposal, item),
    conversionTargetsForItem(context, item.id),
  ]);
  const title =
    patchText(item.proposedPatch, "title", 180) ??
    fallbackText(item, proposal, 180);
  const description =
    patchText(item.proposedPatch, "description", 4000) ??
    cleanText(item.explanation, 4000);

  return {
    conversionTargets,
    initialValues: {
      ...contextDefaults,
      commitmentId: null,
      description,
      dueAt: patchDate(item.proposedPatch, "dueAt"),
      priority: "MEDIUM",
      sourceAIProposalId: proposal.id,
      sourceAIProposalItemId: item.id,
      taskType: "FOLLOW_UP",
      title,
      whyNowRationale: patchText(
        item.proposedPatch,
        "whyNowRationale",
        2000,
      ),
    },
  };
}

export async function getTenantAIProposalItemMeetingConversionDraft(
  context: TenantContext,
  input: ProposalItemConversionSource,
): Promise<AIProposalItemMeetingConversionDraft> {
  await requireTenantAccess(context);

  const { item, proposal } = await prisma.$transaction((db) =>
    loadProposalItemForConversion(context, input, db),
  );
  const [contextDefaults, conversionTargets] = await Promise.all([
    meetingContextDefaults(context, proposal, item),
    conversionTargetsForItem(context, item.id),
  ]);
  const title =
    patchText(item.proposedPatch, "title", 180) ??
    fallbackText(item, proposal, 180);

  return {
    conversionTargets,
    initialValues: {
      ...contextDefaults,
      occurredAt: patchDate(item.proposedPatch, "occurredAt"),
      sourceAIProposalId: proposal.id,
      sourceAIProposalItemId: item.id,
      summary:
        patchText(item.proposedPatch, "summary", 2000) ??
        cleanText(item.explanation, 2000),
      title,
    },
  };
}

export async function createTenantTaskFromAIProposalItem(
  context: TenantContext,
  input: ProposalItemConversionSource & {
    task: TaskMutationInput;
  },
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (db) => {
    const { item, proposal } = await loadProposalItemForConversion(
      context,
      input,
      db,
    );
    const existing = await existingConversionRecord(
      context,
      item.id,
      "TASK",
      db,
    );

    if (existing) {
      const task = await findTaskById(
        {
          tenantId: context.tenantId,
          taskId: existing.id,
        },
        db,
      );

      if (!task) {
        throw new TenantScopedEntityNotFoundError("TASK", existing.id);
      }

      return task;
    }

    await validateTaskLinks(context, input.task, db);

    const task = await createTask(
      {
        tenantId: context.tenantId,
        data: {
          ...input.task,
          createdByUserId: context.userId,
          updatedByUserId: context.userId,
        },
      },
      db,
    );

    await createConversionSourceReference(
      context,
      {
        aiProposalItemId: item.id,
        confidence: item.confidence,
        targetEntityId: task.id,
        targetEntityType: "TASK",
      },
      db,
    );

    await writeAuditLog(
      {
        action: "task.created",
        actorUserId: context.userId,
        entityId: task.id,
        entityType: "Task",
        metadata: {
          companyId: task.companyId,
          hasDueDate: Boolean(task.dueAt),
          meetingId: task.meetingId,
          noteId: task.noteId,
          personId: task.personId,
          priority: task.priority,
          proposalId: proposal.id,
          proposalItemId: item.id,
          source: "suggested-update-conversion",
          taskId: task.id,
          taskType: task.taskType,
        },
        tenantId: context.tenantId,
      },
      db,
    );

    await writeAuditLog(
      {
        action: "ai_proposal_item.converted_to_task",
        actorUserId: context.userId,
        entityId: item.id,
        entityType: "AIProposalItem",
        metadata: {
          changedFields: taskChangedFields(input.task),
          conversionType: "suggested_update_to_task",
          createdTaskId: task.id,
          proposalId: proposal.id,
          proposalItemId: item.id,
          targetEntityType: "TASK",
        },
        tenantId: context.tenantId,
      },
      db,
    );

    return task;
  });
}

export async function createTenantMeetingFromAIProposalItem(
  context: TenantContext,
  input: ProposalItemConversionSource & {
    meeting: MeetingConversionInput;
  },
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (db) => {
    const { item, proposal } = await loadProposalItemForConversion(
      context,
      input,
      db,
    );
    const existing = await existingConversionRecord(
      context,
      item.id,
      "MEETING",
      db,
    );

    if (existing) {
      const meeting = await findMeetingById(
        {
          tenantId: context.tenantId,
          meetingId: existing.id,
        },
        db,
      );

      if (!meeting) {
        throw new TenantScopedEntityNotFoundError("MEETING", existing.id);
      }

      return meeting;
    }

    await validateMeetingLinks(context, input.meeting, db);

    const meeting = await createMeeting(
      {
        tenantId: context.tenantId,
        data: {
          ...input.meeting,
          createdByUserId: context.userId,
          updatedByUserId: context.userId,
        },
      },
      db,
    );

    await createConversionSourceReference(
      context,
      {
        aiProposalItemId: item.id,
        confidence: item.confidence,
        targetEntityId: meeting.id,
        targetEntityType: "MEETING",
      },
      db,
    );

    await writeAuditLog(
      {
        action: "meeting.created",
        actorUserId: context.userId,
        entityId: meeting.id,
        entityType: "Meeting",
        metadata: {
          primaryCompanyId: meeting.primaryCompanyId,
          proposalId: proposal.id,
          proposalItemId: item.id,
          source: "suggested-update-conversion",
          sourceType: meeting.sourceType,
        },
        tenantId: context.tenantId,
      },
      db,
    );

    await writeAuditLog(
      {
        action: "ai_proposal_item.converted_to_meeting",
        actorUserId: context.userId,
        entityId: item.id,
        entityType: "AIProposalItem",
        metadata: {
          changedFields: meetingChangedFields(input.meeting),
          conversionType: "suggested_update_to_meeting",
          createdMeetingId: meeting.id,
          proposalId: proposal.id,
          proposalItemId: item.id,
          targetEntityType: "MEETING",
        },
        tenantId: context.tenantId,
      },
      db,
    );

    return meeting;
  });
}
