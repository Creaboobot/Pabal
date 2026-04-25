import {
  type CommitmentOwnerType,
  type CommitmentStatus,
  type Prisma,
  type Sensitivity,
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  createCommitment,
  findCommitmentById,
  findCommitmentProfileById,
  listCommitmentsForTenant,
  listCommitmentsForTenantWithContext,
  updateCommitment,
} from "@/server/repositories/commitments";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  assertOptionalRelationshipEntityBelongsToTenant,
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export type CommitmentMutationInput = {
  counterpartyCompanyId?: string | null;
  counterpartyPersonId?: string | null;
  description?: string | null;
  dueAt?: Date | null;
  dueWindowEnd?: Date | null;
  dueWindowStart?: Date | null;
  meetingId?: string | null;
  noteId?: string | null;
  ownerCompanyId?: string | null;
  ownerPersonId?: string | null;
  ownerType?: CommitmentOwnerType;
  sensitivity?: Sensitivity;
  status?: CommitmentStatus;
  title: string;
};

type CommitmentBoardCommitment = Awaited<
  ReturnType<typeof listCommitmentsForTenantWithContext>
>[number];

const ACTIVE_DATE_STATUSES: CommitmentStatus[] = ["OPEN", "OVERDUE"];

export class InvalidCommitmentOwnerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCommitmentOwnerError";
  }
}

function startOfDay(value: Date) {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return day;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function commitmentDueBoundary(commitment: {
  dueAt: Date | null;
  dueWindowEnd: Date | null;
  dueWindowStart: Date | null;
}) {
  return commitment.dueAt ?? commitment.dueWindowEnd ?? commitment.dueWindowStart;
}

function isDateTrackedCommitment(commitment: CommitmentBoardCommitment) {
  return ACTIVE_DATE_STATUSES.includes(commitment.status);
}

function validateOwnerRules(data: {
  ownerCompanyId?: string | null;
  ownerPersonId?: string | null;
  ownerType?: CommitmentOwnerType;
}) {
  const ownerType = data.ownerType ?? "UNKNOWN";

  if (
    (ownerType === "ME" || ownerType === "UNKNOWN") &&
    (data.ownerPersonId || data.ownerCompanyId)
  ) {
    throw new InvalidCommitmentOwnerError(
      `${ownerType} commitments cannot include an owner person or company.`,
    );
  }

  if (ownerType === "OTHER_PERSON" && !data.ownerPersonId) {
    throw new InvalidCommitmentOwnerError(
      "Commitments owned by another person need an owner person.",
    );
  }

  if (ownerType === "COMPANY" && !data.ownerCompanyId) {
    throw new InvalidCommitmentOwnerError(
      "Company-owned commitments need an owner company.",
    );
  }
}

function commitmentAuditMetadata(
  commitment: {
    counterpartyCompanyId: string | null;
    counterpartyPersonId: string | null;
    dueAt: Date | null;
    dueWindowEnd: Date | null;
    dueWindowStart: Date | null;
    id: string;
    meetingId: string | null;
    noteId: string | null;
    ownerCompanyId: string | null;
    ownerPersonId: string | null;
    ownerType: CommitmentOwnerType;
    sensitivity: Sensitivity;
    status: CommitmentStatus;
  },
  extra?: Record<string, unknown>,
) {
  return {
    commitmentId: commitment.id,
    counterpartyCompanyId: commitment.counterpartyCompanyId,
    counterpartyPersonId: commitment.counterpartyPersonId,
    hasDueDate: Boolean(commitment.dueAt),
    hasDueWindow: Boolean(
      commitment.dueWindowStart || commitment.dueWindowEnd,
    ),
    meetingId: commitment.meetingId,
    noteId: commitment.noteId,
    ownerCompanyId: commitment.ownerCompanyId,
    ownerPersonId: commitment.ownerPersonId,
    ownerType: commitment.ownerType,
    sensitivity: commitment.sensitivity,
    status: commitment.status,
    ...extra,
  };
}

async function validateCommitmentLinks(
  context: TenantContext,
  data: {
    counterpartyCompanyId?: string | null;
    counterpartyPersonId?: string | null;
    meetingId?: string | null;
    noteId?: string | null;
    ownerCompanyId?: string | null;
    ownerPersonId?: string | null;
  },
  db: Prisma.TransactionClient,
) {
  await Promise.all([
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "PERSON",
        entityId: data.ownerPersonId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "COMPANY",
        entityId: data.ownerCompanyId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "PERSON",
        entityId: data.counterpartyPersonId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "COMPANY",
        entityId: data.counterpartyCompanyId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "MEETING",
        entityId: data.meetingId,
      },
      db,
    ),
    assertOptionalRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "NOTE",
        entityId: data.noteId,
      },
      db,
    ),
  ]);
}

export async function createTenantCommitment(
  context: TenantContext,
  data: CommitmentMutationInput,
) {
  await requireTenantAccess(context);
  validateOwnerRules(data);

  return prisma.$transaction(async (tx) => {
    await validateCommitmentLinks(context, data, tx);

    const commitment = await createCommitment(
      {
        tenantId: context.tenantId,
        data: {
          ...data,
          createdByUserId: context.userId,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "commitment.created",
        entityType: "Commitment",
        entityId: commitment.id,
        metadata: commitmentAuditMetadata(commitment, {
          source: "manual-form",
        }),
      },
      tx,
    );

    return commitment;
  });
}

export async function getTenantCommitment(
  context: TenantContext,
  commitmentId: string,
) {
  await requireTenantAccess(context);

  return findCommitmentById({
    tenantId: context.tenantId,
    commitmentId,
  });
}

export async function getTenantCommitmentProfile(
  context: TenantContext,
  commitmentId: string,
) {
  await requireTenantAccess(context);

  return findCommitmentProfileById({
    tenantId: context.tenantId,
    commitmentId,
  });
}

export async function listTenantCommitments(context: TenantContext) {
  await requireTenantAccess(context);

  return listCommitmentsForTenant(context.tenantId);
}

export async function listTenantCommitmentsWithContext(
  context: TenantContext,
) {
  await requireTenantAccess(context);

  return listCommitmentsForTenantWithContext(context.tenantId);
}

export async function updateTenantCommitment(
  context: TenantContext,
  commitmentId: string,
  data: CommitmentMutationInput,
) {
  await requireTenantAccess(context);
  validateOwnerRules(data);

  return prisma.$transaction(async (tx) => {
    const existing = await findCommitmentById(
      {
        tenantId: context.tenantId,
        commitmentId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("COMMITMENT", commitmentId);
    }

    await validateCommitmentLinks(context, data, tx);

    const changedFields = Object.keys(data).filter(
      (field) => data[field as keyof typeof data] !== undefined,
    );
    const commitment = await updateCommitment(
      {
        tenantId: context.tenantId,
        commitmentId,
        data: {
          ...data,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "commitment.updated",
        entityType: "Commitment",
        entityId: commitment.id,
        metadata: commitmentAuditMetadata(commitment, {
          changedFields,
        }),
      },
      tx,
    );

    return commitment;
  });
}

export async function fulfillTenantCommitment(
  context: TenantContext,
  commitmentId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findCommitmentById(
      {
        tenantId: context.tenantId,
        commitmentId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("COMMITMENT", commitmentId);
    }

    const commitment = await updateCommitment(
      {
        tenantId: context.tenantId,
        commitmentId,
        data: {
          status: "DONE",
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "commitment.fulfilled",
        entityType: "Commitment",
        entityId: commitment.id,
        metadata: commitmentAuditMetadata(commitment),
      },
      tx,
    );

    return commitment;
  });
}

export async function cancelTenantCommitment(
  context: TenantContext,
  commitmentId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findCommitmentById(
      {
        tenantId: context.tenantId,
        commitmentId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("COMMITMENT", commitmentId);
    }

    const commitment = await updateCommitment(
      {
        tenantId: context.tenantId,
        commitmentId,
        data: {
          status: "CANCELLED",
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "commitment.cancelled",
        entityType: "Commitment",
        entityId: commitment.id,
        metadata: commitmentAuditMetadata(commitment),
      },
      tx,
    );

    return commitment;
  });
}

export async function archiveTenantCommitment(
  context: TenantContext,
  commitmentId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findCommitmentById(
      {
        tenantId: context.tenantId,
        commitmentId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("COMMITMENT", commitmentId);
    }

    const commitment = await updateCommitment(
      {
        tenantId: context.tenantId,
        commitmentId,
        data: {
          archivedAt: new Date(),
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "commitment.archived",
        entityType: "Commitment",
        entityId: commitment.id,
        metadata: commitmentAuditMetadata(commitment, {
          source: "manual-form",
        }),
      },
      tx,
    );

    return commitment;
  });
}

export function groupCommitmentBoard(
  commitments: CommitmentBoardCommitment[],
  now = new Date(),
) {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  return {
    dueToday: commitments.filter((commitment) => {
      const due = commitmentDueBoundary(commitment);

      return (
        isDateTrackedCommitment(commitment) &&
        due !== null &&
        due >= now &&
        due < tomorrow
      );
    }),
    openWithoutDue: commitments.filter(
      (commitment) =>
        isDateTrackedCommitment(commitment) &&
        commitmentDueBoundary(commitment) === null,
    ),
    overdue: commitments.filter((commitment) => {
      const due = commitmentDueBoundary(commitment);

      return (
        isDateTrackedCommitment(commitment) && due !== null && due < now
      );
    }),
    recentlyFulfilled: commitments
      .filter((commitment) => commitment.status === "DONE")
      .sort((first, second) => {
        return second.updatedAt.getTime() - first.updatedAt.getTime();
      })
      .slice(0, 5),
    upcoming: commitments.filter((commitment) => {
      const due = commitmentDueBoundary(commitment);

      return (
        isDateTrackedCommitment(commitment) &&
        due !== null &&
        due >= tomorrow
      );
    }),
    waiting: commitments.filter(
      (commitment) => commitment.status === "WAITING",
    ),
  };
}

export async function getTenantCommitmentBoard(context: TenantContext) {
  const commitments = await listTenantCommitmentsWithContext(context);

  return groupCommitmentBoard(commitments);
}
