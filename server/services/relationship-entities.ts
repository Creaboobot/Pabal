import {
  type Prisma,
  type PrismaClient,
  type SourceEntityType,
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type RelationshipEntityClient = PrismaClient | Prisma.TransactionClient;

export class TenantScopedEntityNotFoundError extends Error {
  constructor(entityType: SourceEntityType, entityId: string) {
    super(`${entityType} ${entityId} was not found in the tenant`);
    this.name = "TenantScopedEntityNotFoundError";
  }
}

export async function relationshipEntityExistsInTenant(
  input: {
    tenantId: string;
    entityType: SourceEntityType;
    entityId: string;
  },
  db: RelationshipEntityClient = prisma,
) {
  switch (input.entityType) {
    case "PERSON":
      return (
        (await db.person.count({
          where: { id: input.entityId, tenantId: input.tenantId },
        })) > 0
      );
    case "COMPANY":
      return (
        (await db.company.count({
          where: { id: input.entityId, tenantId: input.tenantId },
        })) > 0
      );
    case "COMPANY_AFFILIATION":
      return (
        (await db.companyAffiliation.count({
          where: { id: input.entityId, tenantId: input.tenantId },
        })) > 0
      );
    case "MEETING":
      return (
        (await db.meeting.count({
          where: { id: input.entityId, tenantId: input.tenantId },
        })) > 0
      );
    case "MEETING_PARTICIPANT":
      return (
        (await db.meetingParticipant.count({
          where: { id: input.entityId, tenantId: input.tenantId },
        })) > 0
      );
    case "NOTE":
      return (
        (await db.note.count({
          where: { id: input.entityId, tenantId: input.tenantId },
        })) > 0
      );
    case "TASK":
      return (
        (await db.task.count({
          where: { id: input.entityId, tenantId: input.tenantId },
        })) > 0
      );
    case "COMMITMENT":
      return (
        (await db.commitment.count({
          where: { id: input.entityId, tenantId: input.tenantId },
        })) > 0
      );
    case "NEED":
      return (
        (await db.need.count({
          where: { id: input.entityId, tenantId: input.tenantId },
        })) > 0
      );
    case "CAPABILITY":
      return (
        (await db.capability.count({
          where: { id: input.entityId, tenantId: input.tenantId },
        })) > 0
      );
    case "INTRODUCTION_SUGGESTION":
      return (
        (await db.introductionSuggestion.count({
          where: { id: input.entityId, tenantId: input.tenantId },
        })) > 0
      );
  }
}

export async function assertRelationshipEntityBelongsToTenant(
  input: {
    tenantId: string;
    entityType: SourceEntityType;
    entityId: string;
  },
  db: RelationshipEntityClient = prisma,
) {
  const exists = await relationshipEntityExistsInTenant(input, db);

  if (!exists) {
    throw new TenantScopedEntityNotFoundError(
      input.entityType,
      input.entityId,
    );
  }
}

export async function assertOptionalRelationshipEntityBelongsToTenant(
  input: {
    tenantId: string;
    entityType: SourceEntityType;
    entityId: string | null | undefined;
  },
  db: RelationshipEntityClient = prisma,
) {
  if (!input.entityId) {
    return;
  }

  await assertRelationshipEntityBelongsToTenant(
    {
      tenantId: input.tenantId,
      entityType: input.entityType,
      entityId: input.entityId,
    },
    db,
  );
}
