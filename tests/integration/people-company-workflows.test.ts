// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import {
  archiveTenantCompany,
  createTenantCompany,
  getTenantCompanyProfile,
  listTenantCompanies,
  updateTenantCompany,
} from "@/server/services/companies";
import {
  archiveTenantPerson,
  createTenantPerson,
  getTenantPersonProfile,
  listTenantPeople,
  updateTenantPerson,
} from "@/server/services/people";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

describeWithDatabase("people and company workflow services", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates, updates, archives, and audits a person", async () => {
    const context = await createTenantContext("person-workflow@example.com");
    const person = await createTenantPerson(context, {
      displayName: "Anna Keller",
      email: "anna@example.com",
      linkedinUrl: "https://www.linkedin.com/in/anna-keller/",
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "WARM",
      salesNavigatorUrl: "https://www.linkedin.com/sales/lead/123",
    });
    const updated = await updateTenantPerson(context, person.id, {
      displayName: "Anna M. Keller",
      email: "anna.keller@example.com",
      firstName: "Anna",
      jobTitle: "Partner",
      lastName: "Keller",
      linkedinUrl: "https://www.linkedin.com/in/anna-m-keller/",
      phone: null,
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "HOT",
      salesNavigatorUrl: "https://www.linkedin.com/sales/people/456",
    });

    expect(updated.displayName).toBe("Anna M. Keller");
    expect(updated.linkedinUrl).toBe(
      "https://www.linkedin.com/in/anna-m-keller/",
    );
    expect(updated.salesNavigatorUrl).toBe(
      "https://www.linkedin.com/sales/people/456",
    );

    await archiveTenantPerson(context, person.id);

    await expect(getTenantPersonProfile(context, person.id)).resolves.toBeNull();
    await expect(listTenantPeople(context)).resolves.toHaveLength(0);

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        entityId: person.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    expect(auditLogs.map((log) => log.action)).toEqual([
      "person.created",
      "person.updated",
      "person.archived",
    ]);
    expect(JSON.stringify(auditLogs)).not.toContain("anna@example.com");
    expect(JSON.stringify(auditLogs)).not.toContain("anna.keller@example.com");
    expect(JSON.stringify(auditLogs)).not.toContain(
      "https://www.linkedin.com/in/anna",
    );
    expect(JSON.stringify(auditLogs)).not.toContain(
      "https://www.linkedin.com/sales/",
    );
  });

  it("creates, updates, archives, and audits a company", async () => {
    const context = await createTenantContext("company-workflow@example.com");
    const company = await createTenantCompany(context, {
      description: "Industrial advisory target",
      industry: "Industrials",
      name: "Nordic Industrials",
      website: "https://example.com",
    });
    const updated = await updateTenantCompany(context, company.id, {
      description: "Strategic industrial network context",
      industry: "Energy",
      name: "Nordic Industrial Group",
      website: "https://nordic.example",
    });

    expect(updated.normalizedName).toBe("nordic industrial group");

    await archiveTenantCompany(context, company.id);

    await expect(
      getTenantCompanyProfile(context, company.id),
    ).resolves.toBeNull();
    await expect(listTenantCompanies(context)).resolves.toHaveLength(0);

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        entityId: company.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    expect(auditLogs.map((log) => log.action)).toEqual([
      "company.created",
      "company.updated",
      "company.archived",
    ]);
    expect(JSON.stringify(auditLogs)).not.toContain(
      "Strategic industrial network context",
    );
  });

  it("denies cross-tenant person reads and writes", async () => {
    const firstContext = await createTenantContext("first-person-6a@example.com");
    const secondContext = await createTenantContext(
      "second-person-6a@example.com",
    );
    const person = await createTenantPerson(firstContext, {
      displayName: "Cross Tenant Person",
    });

    await expect(
      getTenantPersonProfile(secondContext, person.id),
    ).resolves.toBeNull();
    await expect(
      updateTenantPerson(secondContext, person.id, {
        displayName: "Should Fail",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      archiveTenantPerson(secondContext, person.id),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("denies cross-tenant company reads and writes", async () => {
    const firstContext = await createTenantContext("first-company-6a@example.com");
    const secondContext = await createTenantContext(
      "second-company-6a@example.com",
    );
    const company = await createTenantCompany(firstContext, {
      name: "Cross Tenant Company",
    });

    await expect(
      getTenantCompanyProfile(secondContext, company.id),
    ).resolves.toBeNull();
    await expect(
      updateTenantCompany(secondContext, company.id, {
        name: "Should Fail",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      archiveTenantCompany(secondContext, company.id),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });
});
