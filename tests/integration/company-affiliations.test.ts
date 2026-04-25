// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createMeetingParticipant } from "@/server/repositories/meeting-participants";
import { createMeeting } from "@/server/repositories/meetings";
import { createNote } from "@/server/repositories/notes";
import {
  archiveTenantCompanyAffiliation,
  createTenantCompanyAffiliation,
  endTenantCompanyAffiliation,
  updateTenantCompanyAffiliation,
} from "@/server/services/company-affiliations";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantPerson } from "@/server/services/people";
import {
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import {
  getTenantCompanyRelatedContext,
  getTenantPersonRelatedContext,
} from "@/server/services/relationship-context";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

describeWithDatabase("company affiliation workflow services", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates, updates, ends, archives, and audits affiliations safely", async () => {
    const context = await createTenantContext("affiliations@example.com");
    const person = await createTenantPerson(context, {
      displayName: "Sensitive Person",
      email: "sensitive.person@example.com",
    });
    const firstCompany = await createTenantCompany(context, {
      name: "Sensitive Company",
    });
    const secondCompany = await createTenantCompany(context, {
      name: "Second Company",
    });

    const affiliation = await createTenantCompanyAffiliation(context, {
      affiliationTitle: "Confidential advisor",
      companyId: firstCompany.id,
      department: "Private transformation",
      isPrimary: true,
      personId: person.id,
    });

    expect(affiliation.isPrimary).toBe(true);

    const updated = await updateTenantCompanyAffiliation(
      context,
      person.id,
      affiliation.id,
      {
        affiliationTitle: "Executive sponsor",
        companyId: secondCompany.id,
        department: "Operations",
        endsAt: null,
        isPrimary: false,
        startsAt: new Date("2025-01-01T00:00:00.000Z"),
      },
    );

    expect(updated.companyId).toBe(secondCompany.id);
    expect(updated.isPrimary).toBe(false);

    const ended = await endTenantCompanyAffiliation(
      context,
      person.id,
      affiliation.id,
    );

    expect(ended.endsAt).toBeInstanceOf(Date);
    expect(ended.isPrimary).toBe(false);

    const archived = await archiveTenantCompanyAffiliation(
      context,
      person.id,
      affiliation.id,
    );

    expect(archived.archivedAt).toBeInstanceOf(Date);
    expect(archived.isPrimary).toBe(false);

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        entityId: affiliation.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    expect(auditLogs.map((log) => log.action)).toEqual([
      "company_affiliation.created",
      "company_affiliation.primary_changed",
      "company_affiliation.updated",
      "company_affiliation.ended",
      "company_affiliation.archived",
    ]);
    expect(JSON.stringify(auditLogs)).not.toContain("sensitive.person@example.com");
    expect(JSON.stringify(auditLogs)).not.toContain("Sensitive Company");
    expect(JSON.stringify(auditLogs)).not.toContain("Confidential advisor");
  });

  it("sets exactly one active primary affiliation for a person", async () => {
    const context = await createTenantContext("primary-affiliations@example.com");
    const person = await createTenantPerson(context, {
      displayName: "Primary Person",
    });
    const firstCompany = await createTenantCompany(context, {
      name: "First Primary Company",
    });
    const secondCompany = await createTenantCompany(context, {
      name: "Second Primary Company",
    });

    const firstAffiliation = await createTenantCompanyAffiliation(context, {
      companyId: firstCompany.id,
      isPrimary: true,
      personId: person.id,
    });
    const secondAffiliation = await createTenantCompanyAffiliation(context, {
      companyId: secondCompany.id,
      isPrimary: true,
      personId: person.id,
    });

    const affiliations = await prisma.companyAffiliation.findMany({
      where: {
        tenantId: context.tenantId,
        personId: person.id,
        archivedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    expect(affiliations).toHaveLength(2);
    expect(
      affiliations.find((item) => item.id === firstAffiliation.id)?.isPrimary,
    ).toBe(false);
    expect(
      affiliations.find((item) => item.id === secondAffiliation.id)?.isPrimary,
    ).toBe(true);
  });

  it("clears primary when ending or archiving an affiliation", async () => {
    const context = await createTenantContext("clear-primary@example.com");
    const person = await createTenantPerson(context, {
      displayName: "Clear Primary Person",
    });
    const company = await createTenantCompany(context, {
      name: "Clear Primary Company",
    });
    const affiliation = await createTenantCompanyAffiliation(context, {
      companyId: company.id,
      isPrimary: true,
      personId: person.id,
    });

    await endTenantCompanyAffiliation(context, person.id, affiliation.id);

    const ended = await prisma.companyAffiliation.findUniqueOrThrow({
      where: {
        id_tenantId: {
          id: affiliation.id,
          tenantId: context.tenantId,
        },
      },
    });

    expect(ended.isPrimary).toBe(false);

    const secondAffiliation = await createTenantCompanyAffiliation(context, {
      companyId: company.id,
      isPrimary: true,
      personId: person.id,
    });

    await archiveTenantCompanyAffiliation(
      context,
      person.id,
      secondAffiliation.id,
    );

    const archived = await prisma.companyAffiliation.findUniqueOrThrow({
      where: {
        id_tenantId: {
          id: secondAffiliation.id,
          tenantId: context.tenantId,
        },
      },
    });

    expect(archived.isPrimary).toBe(false);
  });

  it("rejects cross-tenant affiliation create, update, end, and archive", async () => {
    const firstContext = await createTenantContext(
      "first-affiliations@example.com",
    );
    const secondContext = await createTenantContext(
      "second-affiliations@example.com",
    );
    const person = await createTenantPerson(firstContext, {
      displayName: "Tenant Person",
    });
    const company = await createTenantCompany(firstContext, {
      name: "Tenant Company",
    });
    const affiliation = await createTenantCompanyAffiliation(firstContext, {
      companyId: company.id,
      personId: person.id,
    });

    await expect(
      createTenantCompanyAffiliation(secondContext, {
        companyId: company.id,
        personId: person.id,
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      updateTenantCompanyAffiliation(secondContext, person.id, affiliation.id, {
        companyId: company.id,
        isPrimary: true,
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      endTenantCompanyAffiliation(secondContext, person.id, affiliation.id),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      archiveTenantCompanyAffiliation(secondContext, person.id, affiliation.id),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("keeps person and company related context tenant-scoped", async () => {
    const firstContext = await createTenantContext(
      "first-context-summary@example.com",
    );
    const secondContext = await createTenantContext(
      "second-context-summary@example.com",
    );
    const person = await createTenantPerson(firstContext, {
      displayName: "Related Person",
    });
    const company = await createTenantCompany(firstContext, {
      name: "Related Company",
    });
    const meeting = await createMeeting({
      tenantId: firstContext.tenantId,
      data: {
        createdByUserId: firstContext.userId,
        primaryCompanyId: company.id,
        title: "Context meeting",
        updatedByUserId: firstContext.userId,
      },
    });
    await createMeetingParticipant({
      tenantId: firstContext.tenantId,
      data: {
        createdByUserId: firstContext.userId,
        meetingId: meeting.id,
        personId: person.id,
        updatedByUserId: firstContext.userId,
      },
    });
    await createNote({
      tenantId: firstContext.tenantId,
      data: {
        body: "Full note text should not be needed by related summaries.",
        companyId: company.id,
        createdByUserId: firstContext.userId,
        noteType: "MEETING",
        personId: person.id,
        sensitivity: "NORMAL",
        summary: "Short relationship note summary.",
        updatedByUserId: firstContext.userId,
      },
    });

    await expect(
      getTenantPersonRelatedContext(firstContext, person.id),
    ).resolves.toMatchObject({
      meetings: [{ title: "Context meeting" }],
      notes: [{ summary: "Short relationship note summary." }],
    });
    await expect(
      getTenantCompanyRelatedContext(firstContext, company.id),
    ).resolves.toMatchObject({
      meetings: [{ title: "Context meeting" }],
      notes: [{ summary: "Short relationship note summary." }],
    });
    await expect(
      getTenantPersonRelatedContext(secondContext, person.id),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    await expect(
      getTenantCompanyRelatedContext(secondContext, company.id),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });
});
