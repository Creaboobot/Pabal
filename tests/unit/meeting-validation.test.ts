import { describe, expect, it } from "vitest";

import {
  meetingFormSchema,
  meetingParticipantFormSchema,
} from "@/modules/meetings/validation";

describe("meeting validation", () => {
  it("accepts a valid manual meeting", () => {
    const parsed = meetingFormSchema.safeParse({
      endedAt: "2026-04-24T11:00",
      location: "Teams",
      occurredAt: "2026-04-24T10:00",
      primaryCompanyId: "",
      sourceType: "MANUAL",
      summary: "Discussed MBSE training readiness.",
      title: "MBSE readiness discussion",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects missing title and invalid end time", () => {
    const parsed = meetingFormSchema.safeParse({
      endedAt: "2026-04-24T09:00",
      location: "",
      occurredAt: "2026-04-24T10:00",
      primaryCompanyId: "",
      sourceType: "MANUAL",
      summary: "",
      title: "",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.title?.[0]).toContain(
      "required",
    );
    expect(parsed.error?.flatten().fieldErrors.endedAt?.[0]).toContain(
      "End time",
    );
  });

  it("rejects invalid source types", () => {
    const parsed = meetingFormSchema.safeParse({
      endedAt: "",
      location: "",
      occurredAt: "2026-04-24T10:00",
      primaryCompanyId: "",
      sourceType: "GRAPH_IMPORT",
      summary: "",
      title: "Meeting",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.sourceType).toBeDefined();
  });

  it("does not allow LinkedIn user-provided source on meeting forms", () => {
    const parsed = meetingFormSchema.safeParse({
      endedAt: "",
      location: "",
      occurredAt: "2026-04-24T10:00",
      primaryCompanyId: "",
      sourceType: "LINKEDIN_USER_PROVIDED",
      summary: "",
      title: "Meeting",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.sourceType).toBeDefined();
  });

  it("requires a known person or a participant snapshot", () => {
    const parsed = meetingParticipantFormSchema.safeParse({
      companyId: "",
      emailSnapshot: "",
      nameSnapshot: "",
      participantRole: "ATTENDEE",
      personId: "",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.personId?.[0]).toContain(
      "known person",
    );
  });

  it("accepts a snapshot participant with valid email", () => {
    const parsed = meetingParticipantFormSchema.safeParse({
      companyId: "",
      emailSnapshot: "guest@example.com",
      nameSnapshot: "Guest Person",
      participantRole: "ATTENDEE",
      personId: "",
    });

    expect(parsed.success).toBe(true);
  });
});
