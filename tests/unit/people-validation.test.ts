import { describe, expect, it } from "vitest";

import {
  companyFormSchema,
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
});
