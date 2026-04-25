import { prisma } from "@/server/db/prisma";
import {
  createCompanyAffiliation,
  findCompanyAffiliationForPerson,
  updateCompanyAffiliation,
  unsetOtherPrimaryCompanyAffiliations,
} from "@/server/repositories/company-affiliations";
import { writeAuditLog } from "@/server/services/audit-log";
import {
  assertRelationshipEntityBelongsToTenant,
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

type CompanyAffiliationMutationInput = {
  affiliationTitle?: string | null;
  companyId: string;
  department?: string | null;
  endsAt?: Date | null;
  isPrimary?: boolean;
  personId: string;
  startsAt?: Date | null;
};

type CompanyAffiliationUpdateInput = Omit<
  CompanyAffiliationMutationInput,
  "personId"
>;

export async function createTenantCompanyAffiliation(
  context: TenantContext,
  data: CompanyAffiliationMutationInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    await assertRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "PERSON",
        entityId: data.personId,
      },
      tx,
    );
    await assertRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "COMPANY",
        entityId: data.companyId,
      },
      tx,
    );

    const nextIsPrimary = Boolean(data.isPrimary) && !data.endsAt;

    if (nextIsPrimary) {
      await unsetOtherPrimaryCompanyAffiliations(
        {
          tenantId: context.tenantId,
          personId: data.personId,
        },
        tx,
      );
    }

    const affiliation = await createCompanyAffiliation(
      {
        tenantId: context.tenantId,
        data: {
          ...data,
          isPrimary: nextIsPrimary,
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
        action: "company_affiliation.created",
        entityType: "CompanyAffiliation",
        entityId: affiliation.id,
        metadata: {
          isPrimary: nextIsPrimary,
          source: "manual-form",
        },
      },
      tx,
    );

    if (nextIsPrimary) {
      await writeAuditLog(
        {
          tenantId: context.tenantId,
          actorUserId: context.userId,
          action: "company_affiliation.primary_changed",
          entityType: "CompanyAffiliation",
          entityId: affiliation.id,
          metadata: {
            source: "manual-form",
          },
        },
        tx,
      );
    }

    return affiliation;
  });
}

export async function getTenantCompanyAffiliationForPerson(
  context: TenantContext,
  personId: string,
  companyAffiliationId: string,
) {
  await requireTenantAccess(context);

  return findCompanyAffiliationForPerson({
    tenantId: context.tenantId,
    personId,
    companyAffiliationId,
  });
}

export async function updateTenantCompanyAffiliation(
  context: TenantContext,
  personId: string,
  companyAffiliationId: string,
  data: CompanyAffiliationUpdateInput,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findCompanyAffiliationForPerson(
      {
        tenantId: context.tenantId,
        personId,
        companyAffiliationId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError(
        "COMPANY_AFFILIATION",
        companyAffiliationId,
      );
    }

    await assertRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "PERSON",
        entityId: personId,
      },
      tx,
    );
    await assertRelationshipEntityBelongsToTenant(
      {
        tenantId: context.tenantId,
        entityType: "COMPANY",
        entityId: data.companyId,
      },
      tx,
    );

    const nextIsPrimary = Boolean(data.isPrimary) && !data.endsAt;

    if (nextIsPrimary) {
      await unsetOtherPrimaryCompanyAffiliations(
        {
          tenantId: context.tenantId,
          personId,
          companyAffiliationId,
        },
        tx,
      );
    }

    const changedFields = Object.keys(data).filter(
      (field) => data[field as keyof typeof data] !== undefined,
    );
    const affiliation = await updateCompanyAffiliation(
      {
        tenantId: context.tenantId,
        companyAffiliationId,
        data: {
          ...data,
          isPrimary: nextIsPrimary,
          personId,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "company_affiliation.updated",
        entityType: "CompanyAffiliation",
        entityId: affiliation.id,
        metadata: {
          changedFields,
        },
      },
      tx,
    );

    if (nextIsPrimary && !existing?.isPrimary) {
      await writeAuditLog(
        {
          tenantId: context.tenantId,
          actorUserId: context.userId,
          action: "company_affiliation.primary_changed",
          entityType: "CompanyAffiliation",
          entityId: affiliation.id,
          metadata: {
            source: "manual-form",
          },
        },
        tx,
      );
    }

    return affiliation;
  });
}

export async function endTenantCompanyAffiliation(
  context: TenantContext,
  personId: string,
  companyAffiliationId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findCompanyAffiliationForPerson(
      {
        tenantId: context.tenantId,
        personId,
        companyAffiliationId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError(
        "COMPANY_AFFILIATION",
        companyAffiliationId,
      );
    }

    const affiliation = await updateCompanyAffiliation(
      {
        tenantId: context.tenantId,
        companyAffiliationId,
        data: {
          endsAt: new Date(),
          isPrimary: false,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "company_affiliation.ended",
        entityType: "CompanyAffiliation",
        entityId: affiliation.id,
        metadata: {
          source: "manual-form",
        },
      },
      tx,
    );

    return affiliation;
  });
}

export async function archiveTenantCompanyAffiliation(
  context: TenantContext,
  personId: string,
  companyAffiliationId: string,
) {
  await requireTenantAccess(context);

  return prisma.$transaction(async (tx) => {
    const existing = await findCompanyAffiliationForPerson(
      {
        tenantId: context.tenantId,
        personId,
        companyAffiliationId,
      },
      tx,
    );

    if (!existing) {
      throw new TenantScopedEntityNotFoundError(
        "COMPANY_AFFILIATION",
        companyAffiliationId,
      );
    }

    const affiliation = await updateCompanyAffiliation(
      {
        tenantId: context.tenantId,
        companyAffiliationId,
        data: {
          archivedAt: new Date(),
          isPrimary: false,
          updatedByUserId: context.userId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        tenantId: context.tenantId,
        actorUserId: context.userId,
        action: "company_affiliation.archived",
        entityType: "CompanyAffiliation",
        entityId: affiliation.id,
        metadata: {
          source: "manual-form",
        },
      },
      tx,
    );

    return affiliation;
  });
}
