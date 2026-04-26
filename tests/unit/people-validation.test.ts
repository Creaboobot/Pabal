import { describe, expect, it, vi } from "vitest";

import {
  companyAffiliationFormSchema,
  companyFormSchema,
  editAffiliationFormSchema,
  personAffiliationFormSchema,
  personFormSchema,
} from "@/modules/people/validation";

describe("people and company form validation", () => {
  it("requires a person display name and validates email", () => {
    const result = personFormSchema.safeParse({
      displayName: " ",
      email: "not-an-email",
      firstName: "",
      jobTitle: "",
      lastName: "",
      phone: "",
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "WARM",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.displayName).toBeDefined();
    expect(result.error?.flatten().fieldErrors.email).toBeDefined();
  });

  it("normalizes optional person fields to null", () => {
    const result = personFormSchema.safeParse({
      displayName: "  Anna Keller  ",
      email: "",
      firstName: "",
      jobTitle: "",
      lastName: "",
      phone: "",
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "WARM",
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      displayName: "Anna Keller",
      email: null,
      firstName: null,
      jobTitle: null,
      lastName: null,
      phone: null,
    });
  });

  it("limits phone length", () => {
    const result = personFormSchema.safeParse({
      displayName: "Anna Keller",
      email: "",
      firstName: "",
      jobTitle: "",
      lastName: "",
      phone: "1".repeat(65),
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "WARM",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.phone).toBeDefined();
  });

  it("accepts valid LinkedIn and Sales Navigator URLs", () => {
    const result = personFormSchema.safeParse({
      displayName: "Anna Keller",
      email: "",
      firstName: "",
      jobTitle: "",
      lastName: "",
      linkedinUrl: "https://www.linkedin.com/in/anna-keller/",
      phone: "",
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "WARM",
      salesNavigatorUrl: "https://www.linkedin.com/sales/lead/123",
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      linkedinUrl: "https://www.linkedin.com/in/anna-keller/",
      salesNavigatorUrl: "https://www.linkedin.com/sales/lead/123",
    });
  });

  it("rejects invalid LinkedIn and Sales Navigator URLs", () => {
    const nonLinkedIn = personFormSchema.safeParse({
      displayName: "Anna Keller",
      linkedinUrl: "https://example.com/in/anna-keller",
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "WARM",
      salesNavigatorUrl: "https://www.linkedin.com/company/example",
    });
    const nonHttps = personFormSchema.safeParse({
      displayName: "Anna Keller",
      linkedinUrl: "http://www.linkedin.com/in/anna-keller",
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "WARM",
      salesNavigatorUrl: "http://www.linkedin.com/sales/lead/123",
    });

    expect(nonLinkedIn.success).toBe(false);
    expect(nonLinkedIn.error?.flatten().fieldErrors.linkedinUrl).toBeDefined();
    expect(
      nonLinkedIn.error?.flatten().fieldErrors.salesNavigatorUrl,
    ).toBeDefined();
    expect(nonHttps.success).toBe(false);
    expect(nonHttps.error?.flatten().fieldErrors.linkedinUrl?.[0]).toContain(
      "HTTPS",
    );
    expect(
      nonHttps.error?.flatten().fieldErrors.salesNavigatorUrl?.[0],
    ).toContain("HTTPS");
  });

  it("validates LinkedIn URLs without network calls", () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("should not be called"));

    const result = personFormSchema.safeParse({
      displayName: "Anna Keller",
      linkedinUrl: "https://www.linkedin.com/in/anna-keller/",
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "WARM",
      salesNavigatorUrl: "https://www.linkedin.com/sales/people/123",
    });

    expect(result.success).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("requires company name and validates website", () => {
    const result = companyFormSchema.safeParse({
      description: "",
      industry: "",
      name: "",
      website: "example dot com",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.name).toBeDefined();
    expect(result.error?.flatten().fieldErrors.website).toBeDefined();
  });

  it("normalizes optional company fields to null", () => {
    const result = companyFormSchema.safeParse({
      description: "",
      industry: "",
      name: "  Nordic Industrials  ",
      website: "",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      description: null,
      industry: null,
      name: "Nordic Industrials",
      website: null,
    });
  });

  it("requires company when creating an affiliation from a person", () => {
    const result = personAffiliationFormSchema.safeParse({
      affiliationTitle: "",
      companyId: "",
      department: "",
      endsAt: "",
      isPrimary: false,
      startsAt: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.companyId).toBeDefined();
  });

  it("requires person when creating an affiliation from a company", () => {
    const result = companyAffiliationFormSchema.safeParse({
      affiliationTitle: "",
      department: "",
      endsAt: "",
      isPrimary: false,
      personId: "",
      startsAt: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.personId).toBeDefined();
  });

  it("validates affiliation date consistency", () => {
    const result = editAffiliationFormSchema.safeParse({
      affiliationTitle: "Advisor",
      companyId: "company_1",
      department: "Transformation",
      endsAt: "2025-01-01",
      isPrimary: false,
      startsAt: "2025-02-01",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.endsAt).toBeDefined();
  });

  it("limits affiliation title and department length", () => {
    const result = editAffiliationFormSchema.safeParse({
      affiliationTitle: "A".repeat(121),
      companyId: "company_1",
      department: "B".repeat(121),
      endsAt: "",
      isPrimary: false,
      startsAt: "",
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.flatten().fieldErrors.affiliationTitle,
    ).toBeDefined();
    expect(result.error?.flatten().fieldErrors.department).toBeDefined();
  });

  it("does not allow ended affiliations to be primary", () => {
    const result = editAffiliationFormSchema.safeParse({
      affiliationTitle: "Advisor",
      companyId: "company_1",
      department: "",
      endsAt: "2025-01-01",
      isPrimary: true,
      startsAt: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.isPrimary).toBeDefined();
  });
});
