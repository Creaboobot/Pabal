import { type Prisma } from "@prisma/client";

import {
  createPerson,
  findPersonById,
  listPeopleForTenant,
} from "@/server/repositories/people";
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

  return createPerson({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
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

export async function listTenantPeople(context: TenantContext) {
  await requireTenantAccess(context);

  return listPeopleForTenant(context.tenantId);
}
