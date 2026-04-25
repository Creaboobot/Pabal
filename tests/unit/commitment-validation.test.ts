import { describe, expect, it } from "vitest";

import { commitmentFormSchema } from "@/modules/commitments/validation";

const validCommitment = {
  counterpartyCompanyId: "",
  counterpartyPersonId: "",
  description: "Send the benchmark outline after the meeting.",
  dueAt: "2026-04-24T10:00",
  dueWindowEnd: "",
  dueWindowStart: "",
  meetingId: "",
  noteId: "",
  ownerCompanyId: "",
  ownerPersonId: "",
  ownerType: "ME",
  sensitivity: "NORMAL",
  status: "OPEN",
  title: "Send benchmark outline",
};

describe("commitment validation", () => {
  it("accepts a valid manual commitment", () => {
    const parsed = commitmentFormSchema.safeParse(validCommitment);

    expect(parsed.success).toBe(true);
  });

  it("rejects missing title and invalid enum values", () => {
    const parsed = commitmentFormSchema.safeParse({
      ...validCommitment,
      ownerType: "TEAM",
      sensitivity: "PRIVATE",
      status: "BLOCKED",
      title: "",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.title?.[0]).toContain(
      "required",
    );
    expect(parsed.error?.flatten().fieldErrors.ownerType).toBeDefined();
    expect(parsed.error?.flatten().fieldErrors.sensitivity).toBeDefined();
    expect(parsed.error?.flatten().fieldErrors.status).toBeDefined();
  });

  it("rejects owner records for me or unknown commitments", () => {
    const parsed = commitmentFormSchema.safeParse({
      ...validCommitment,
      ownerPersonId: "person_test_1",
      ownerType: "ME",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.ownerType?.[0]).toContain(
      "cannot include owner records",
    );
  });

  it("requires an owner person or company for non-self owner types", () => {
    const personOwned = commitmentFormSchema.safeParse({
      ...validCommitment,
      ownerType: "OTHER_PERSON",
    });
    const companyOwned = commitmentFormSchema.safeParse({
      ...validCommitment,
      ownerType: "COMPANY",
    });

    expect(personOwned.success).toBe(false);
    expect(
      personOwned.error?.flatten().fieldErrors.ownerPersonId,
    ).toBeDefined();
    expect(companyOwned.success).toBe(false);
    expect(
      companyOwned.error?.flatten().fieldErrors.ownerCompanyId,
    ).toBeDefined();
  });

  it("rejects due window end before start", () => {
    const parsed = commitmentFormSchema.safeParse({
      ...validCommitment,
      dueAt: "",
      dueWindowEnd: "2026-04-23T10:00",
      dueWindowStart: "2026-04-24T10:00",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.dueWindowEnd?.[0]).toContain(
      "must not be before",
    );
  });

  it("rejects overlong descriptions", () => {
    const parsed = commitmentFormSchema.safeParse({
      ...validCommitment,
      description: "a".repeat(4001),
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.description).toBeDefined();
  });
});
