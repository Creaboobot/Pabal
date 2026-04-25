import { type Prisma } from "@prisma/client";

import { createCompanyAffiliation } from "@/server/repositories/company-affiliations";
import { assertRelationshipEntityBelongsToTenant } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function createTenantCompanyAffiliation(
  context: TenantContext,
  data: Omit<
    Prisma.CompanyAffiliationUncheckedCreateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId"
  >,
) {
  await requireTenantAccess(context);
  await assertRelationshipEntityBelongsToTenant({
    tenantId: context.tenantId,
    entityType: "PERSON",
    entityId: data.personId,
  });
  await assertRelationshipEntityBelongsToTenant({
    tenantId: context.tenantId,
    entityType: "COMPANY",
    entityId: data.companyId,
  });

  return createCompanyAffiliation({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
  });
}
