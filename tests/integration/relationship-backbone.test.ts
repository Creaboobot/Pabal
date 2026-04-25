// @vitest-environment node
import { beforeEach, expect, it } from "vitest";

import { seedRelationshipBackboneDemoData } from "@/prisma/seed-data/relationship-backbone";
import { prisma } from "@/server/db/prisma";
import { createCompanyAffiliation } from "@/server/repositories/company-affiliations";
import { createTenantCompanyAffiliation } from "@/server/services/company-affiliations";
import {
  createTenantCompany,
  getTenantCompany,
  listTenantCompanies,
} from "@/server/services/companies";
import { createTenantMeeting, createTenantMeetingParticipant } from "@/server/services/meetings";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson, getTenantPerson, listTenantPeople } from "@/server/services/people";
import {
  TenantScopedEntityNotFoundError,
} from "@/server/services/relationship-entities";
import { createTenantSourceReference } from "@/server/services/source-references";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

describeWithDatabase("relationship backbone tenant isolation", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates and lists people and companies within a tenant", async () => {
    const context = await createTenantContext("backbone@example.com");

    const person = await createTenantPerson(context, {
      displayName: "Anna Keller",
      email: "anna@example.com",
      relationshipStatus: "ACTIVE",
    });
    const company = await createTenantCompany(context, {
      name: "Nordic Industrials",
      industry: "Industrial manufacturing",
    });

    const people = await listTenantPeople(context);
    const companies = await listTenantCompanies(context);

    expect(person.tenantId).toBe(context.tenantId);
    expect(company.tenantId).toBe(context.tenantId);
    expect(people.map((item) => item.id)).toContain(person.id);
    expect(companies.map((item) => item.id)).toContain(company.id);
  });

  it("returns null for cross-tenant person reads", async () => {
    const firstContext = await createTenantContext("first-backbone@example.com");
    const secondContext = await createTenantContext("second-backbone@example.com");
    const person = await createTenantPerson(firstContext, {
      displayName: "Michael Brandt",
    });

    await expect(getTenantPerson(firstContext, person.id)).resolves.toMatchObject({
      id: person.id,
    });
    await expect(getTenantPerson(secondContext, person.id)).resolves.toBeNull();
  });

  it("returns null for cross-tenant company reads", async () => {
    const firstContext = await createTenantContext("first-company-read@example.com");
    const secondContext = await createTenantContext("second-company-read@example.com");
    const company = await createTenantCompany(firstContext, {
      name: "Tenant Scoped Company",
    });

    await expect(getTenantCompany(firstContext, company.id)).resolves.toMatchObject({
      id: company.id,
    });
    await expect(getTenantCompany(secondContext, company.id)).resolves.toBeNull();
  });

  it("rejects cross-tenant company affiliations in the service layer", async () => {
    const firstContext = await createTenantContext("first-affiliation@example.com");
    const secondContext = await createTenantContext("second-affiliation@example.com");
    const person = await createTenantPerson(firstContext, {
      displayName: "Laura Meyer",
    });
    const company = await createTenantCompany(secondContext, {
      name: "Other Tenant Company",
    });

    await expect(
      createTenantCompanyAffiliation(firstContext, {
        personId: person.id,
        companyId: company.id,
        affiliationTitle: "Advisor",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("rejects cross-tenant company affiliations at the database relation layer", async () => {
    const firstContext = await createTenantContext("first-db-affiliation@example.com");
    const secondContext = await createTenantContext("second-db-affiliation@example.com");
    const person = await createTenantPerson(firstContext, {
      displayName: "Peter Hansen",
    });
    const company = await createTenantCompany(secondContext, {
      name: "Cross Tenant Company",
    });

    await expect(
      createCompanyAffiliation({
        tenantId: firstContext.tenantId,
        data: {
          personId: person.id,
          companyId: company.id,
          affiliationTitle: "Should fail",
          createdByUserId: firstContext.userId,
          updatedByUserId: firstContext.userId,
        },
      }),
    ).rejects.toThrow();
  });

  it("creates meeting participants and notes with tenant-scoped links", async () => {
    const context = await createTenantContext("meeting-backbone@example.com");
    const company = await createTenantCompany(context, {
      name: "Vestas Energy",
    });
    const person = await createTenantPerson(context, {
      displayName: "Peter Hansen",
    });
    const meeting = await createTenantMeeting(context, {
      title: "MBSE readiness discussion",
      primaryCompanyId: company.id,
    });
    const participant = await createTenantMeetingParticipant(context, {
      meetingId: meeting.id,
      personId: person.id,
      companyId: company.id,
      participantRole: "HOST",
    });
    const note = await createTenantNote(context, {
      body: "Peter asked for a practical three-day MBSE training agenda.",
      meetingId: meeting.id,
      personId: person.id,
      companyId: company.id,
      noteType: "MEETING",
    });

    expect(participant.tenantId).toBe(context.tenantId);
    expect(note.tenantId).toBe(context.tenantId);
  });

  it("prevents SourceReference links across tenants", async () => {
    const firstContext = await createTenantContext("first-source@example.com");
    const secondContext = await createTenantContext("second-source@example.com");
    const person = await createTenantPerson(firstContext, {
      displayName: "Anna Keller",
    });
    const note = await createTenantNote(firstContext, {
      body: "Anna has PLM governance context.",
      personId: person.id,
      noteType: "PERSON",
    });
    const company = await createTenantCompany(secondContext, {
      name: "Other Tenant Company",
    });

    await expect(
      createTenantSourceReference(firstContext, {
        sourceEntityType: "NOTE",
        sourceEntityId: note.id,
        targetEntityType: "COMPANY",
        targetEntityId: company.id,
        label: "invalid-cross-tenant-link",
      }),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
  });

  it("seeds Step 4A demo data idempotently", async () => {
    await seedRelationshipBackboneDemoData(prisma);
    await seedRelationshipBackboneDemoData(prisma);

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: "demo-workspace" },
    });

    await expect(
      prisma.company.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(2);
    await expect(
      prisma.person.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(4);
    await expect(
      prisma.companyAffiliation.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(4);
    await expect(
      prisma.meeting.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(1);
    await expect(
      prisma.meetingParticipant.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(2);
    await expect(
      prisma.note.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(3);
    await expect(
      prisma.sourceReference.count({ where: { tenantId: tenant.id } }),
    ).resolves.toBe(2);
  });
});
