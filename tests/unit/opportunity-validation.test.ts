import { describe, expect, it } from "vitest";

import {
  capabilityFormSchema,
  needFormSchema,
} from "@/modules/opportunities/validation";

describe("opportunity validation", () => {
  it("validates need form values", () => {
    expect(
      needFormSchema.safeParse({
        companyId: "",
        confidence: "0.75",
        description: "Need description",
        meetingId: "",
        needType: "REQUEST",
        noteId: "",
        personId: "person_1",
        priority: "HIGH",
        sensitivity: "NORMAL",
        status: "OPEN",
        title: "Need practical training examples",
      }).success,
    ).toBe(true);
    expect(
      needFormSchema.safeParse({
        confidence: "2",
        needType: "REQUEST",
        priority: "HIGH",
        sensitivity: "NORMAL",
        status: "OPEN",
        title: "",
      }).success,
    ).toBe(false);
  });

  it("validates capability form values", () => {
    expect(
      capabilityFormSchema.safeParse({
        capabilityType: "EXPERIENCE",
        companyId: "company_1",
        confidence: "0.5",
        description: "Capability description",
        noteId: "",
        personId: "",
        sensitivity: "NORMAL",
        status: "ACTIVE",
        title: "SE-CERT preparation experience",
      }).success,
    ).toBe(true);
    expect(
      capabilityFormSchema.safeParse({
        capabilityType: "EXPERIENCE",
        confidence: "-1",
        sensitivity: "NORMAL",
        status: "ACTIVE",
        title: "",
      }).success,
    ).toBe(false);
  });
});
