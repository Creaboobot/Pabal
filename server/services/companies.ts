import { type Prisma } from "@prisma/client";

import {
  createCompany,
  findCompanyById,
  listCompaniesForTenant,
} from "@/server/repositories/companies";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export function normalizeCompanyName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function createTenantCompany(
  context: TenantContext,
  data: Omit<
    Prisma.CompanyUncheckedCreateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId" | "normalizedName"
  > & {
    normalizedName?: string;
  },
) {
  await requireTenantAccess(context);

  return createCompany({
    tenantId: context.tenantId,
    data: {
      ...data,
      normalizedName: data.normalizedName ?? normalizeCompanyName(data.name),
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
  });
}

export async function getTenantCompany(
  context: TenantContext,
  companyId: string,
) {
  await requireTenantAccess(context);

  return findCompanyById({
    tenantId: context.tenantId,
    companyId,
  });
}

export async function listTenantCompanies(context: TenantContext) {
  await requireTenantAccess(context);

  return listCompaniesForTenant(context.tenantId);
}
