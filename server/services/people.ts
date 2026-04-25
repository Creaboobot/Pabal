import { type Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  createPerson,
  findPersonById,
  findPersonProfileById,
  listPeopleForTenant,
  listPeopleForTenantWithProfiles,
  updatePerson,
} from "@/server/repositories/people";
import { writeAuditLog } from "@/server/services/audit-log";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function createTenantPerson(
  context: TenantContext,
  data: Omit<
    Prisma.PersonUncheckedCreateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId"
  >,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const person = await createPerson(
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
        action: "person.created",
        entityType: "Person",
        entityId: person.id,
        metadata: {
          source: "manual-form",
        },
      },
      tx,
    );

    return person;
  });
}

export async function getTenantPerson(
  context: TenantContext,
  personId: string,
) {
  await requireTenantAccess(context);

  return findPersonById({
    tenantId: context.tenantId,
    personId,
  });
}

export async function getTenantPersonProfile(
  context: TenantContext,
  personId: string,
) {
  await requireTenantAccess(context);

  return findPersonProfileById({
    tenantId: context.tenantId,
    personId,
  });
}

export async function listTenantPeople(context: TenantContext) {
  await requireTenantAccess(context);

  return listPeopleForTenant(context.tenantId);
}

export async function listTenantPeopleWithProfiles(context: TenantContext) {
  await requireTenantAccess(context);

  return listPeopleForTenantWithProfiles(context.tenantId);
}

export async function updateTenantPerson(
  context: TenantContext,
  personId: string,
  data: Omit<
    Prisma.PersonUncheckedUpdateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId" | "archivedAt"
  >,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findPersonById(
      {
        tenantId: context.tenantId,
        personId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("PERSON", personId);
    }

    const changedFields = Object.keys(data).filter(
      (field) => data[field as keyof typeof data] !== undefined,
    );
    const person = await updatePerson(
      {
        tenantId: context.tenantId,
        personId,
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
        action: "person.updated",
        entityType: "Person",
        entityId: person.id,
        metadata: {
          changedFields,
        },
      },
      tx,
    );

    return person;
  });
}

export async function archiveTenantPerson(
  context: TenantContext,
  personId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findPersonById(
      {
        tenantId: context.tenantId,
        personId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("PERSON", personId);
    }

    const person = await updatePerson(
      {
        tenantId: context.tenantId,
        personId,
        data: {
          archivedAt: new Date(),
          relationshipStatus: "ARCHIVED",
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "person.archived",
        entityType: "Person",
        entityId: person.id,
        metadata: {
          source: "manual-form",
        },
      },
      tx,
    );

    return person;
  });
}
