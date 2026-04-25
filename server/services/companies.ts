import { type Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  createCompany,
  findCompanyById,
  findCompanyProfileById,
  listCompaniesForTenant,
  listCompaniesForTenantWithProfiles,
  updateCompany,
} from "@/server/repositories/companies";
import { writeAuditLog } from "@/server/services/audit-log";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
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

  return prisma.$transaction(async (tx) => {
    const company = await createCompany(
      {
        tenantId: context.tenantId,
        data: {
          ...data,
          normalizedName: data.normalizedName ?? normalizeCompanyName(data.name),
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
        action: "company.created",
        entityType: "Company",
        entityId: company.id,
        metadata: {
          source: "manual-form",
        },
      },
      tx,
    );

    return company;
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

export async function getTenantCompanyProfile(
  context: TenantContext,
  companyId: string,
) {
  await requireTenantAccess(context);

  return findCompanyProfileById({
    tenantId: context.tenantId,
    companyId,
  });
}

export async function listTenantCompanies(context: TenantContext) {
  await requireTenantAccess(context);

  return listCompaniesForTenant(context.tenantId);
}

export async function listTenantCompaniesWithProfiles(context: TenantContext) {
  await requireTenantAccess(context);

  return listCompaniesForTenantWithProfiles(context.tenantId);
}

export async function updateTenantCompany(
  context: TenantContext,
  companyId: string,
  data: Omit<
    Prisma.CompanyUncheckedUpdateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId" | "archivedAt"
  >,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findCompanyById(
      {
        tenantId: context.tenantId,
        companyId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("COMPANY", companyId);
    }

    const changedFields = Object.keys(data).filter(
      (field) => data[field as keyof typeof data] !== undefined,
    );
    const updateData: Prisma.CompanyUncheckedUpdateInput = {
      ...data,
      updatedByUserId: context.userId,
    };

    if (typeof data.name === "string") {
      updateData.normalizedName = normalizeCompanyName(data.name);
    }

    const company = await updateCompany(
      {
        tenantId: context.tenantId,
        companyId,
        data: updateData,
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "company.updated",
        entityType: "Company",
        entityId: company.id,
        metadata: {
          changedFields,
        },
      },
      tx,
    );

    return company;
  });
}

export async function archiveTenantCompany(
  context: TenantContext,
  companyId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findCompanyById(
      {
        tenantId: context.tenantId,
        companyId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError("COMPANY", companyId);
    }

    const company = await updateCompany(
      {
        tenantId: context.tenantId,
        companyId,
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
        action: "company.archived",
        entityType: "Company",
        entityId: company.id,
        metadata: {
          source: "manual-form",
        },
      },
      tx,
    );

    return company;
  });
}
