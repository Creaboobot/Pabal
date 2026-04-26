import { describe, expect, it } from "vitest";

import {
  noteFormSchema,
  pastedMeetingCaptureFormSchema,
} from "@/modules/notes/validation";

describe("note validation", () => {
  it("accepts a valid manual note", () => {
    const parsed = noteFormSchema.safeParse({
      body: "Manual relationship note.",
      companyId: "",
      meetingId: "",
      noteType: "GENERAL",
      personId: "",
      sensitivity: "NORMAL",
      sourceType: "MANUAL",
      summary: "Short summary.",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts a LinkedIn user-provided note source", () => {
    const parsed = noteFormSchema.safeParse({
      body: "Manually pasted LinkedIn context.",
      companyId: "",
      meetingId: "",
      noteType: "SOURCE_EXCERPT",
      personId: "person_1",
      sensitivity: "NORMAL",
      sourceType: "LINKEDIN_USER_PROVIDED",
      summary: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects missing body, invalid source, and invalid sensitivity", () => {
    const parsed = noteFormSchema.safeParse({
      body: "",
      companyId: "",
      meetingId: "",
      noteType: "GENERAL",
      personId: "",
      sensitivity: "PRIVATE",
      sourceType: "GRAPH_IMPORT",
      summary: "",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.body?.[0]).toContain(
      "required",
    );
    expect(parsed.error?.flatten().fieldErrors.sourceType).toBeDefined();
    expect(parsed.error?.flatten().fieldErrors.sensitivity).toBeDefined();
  });

  it("rejects overlong regular and pasted note bodies", () => {
    const regular = noteFormSchema.safeParse({
      body: "a".repeat(20001),
      companyId: "",
      meetingId: "",
      noteType: "GENERAL",
      personId: "",
      sensitivity: "NORMAL",
      sourceType: "MANUAL",
      summary: "",
    });
    const pasted = pastedMeetingCaptureFormSchema.safeParse({
      body: "a".repeat(80001),
      endedAt: "",
      occurredAt: "2026-04-24T10:00",
      participantPersonIds: [],
      primaryCompanyId: "",
      sensitivity: "NORMAL",
      summary: "",
      title: "Pasted notes",
    });

    expect(regular.success).toBe(false);
    expect(pasted.success).toBe(false);
  });

  it("accepts pasted meeting capture and rejects invalid end time", () => {
    const valid = pastedMeetingCaptureFormSchema.safeParse({
      body: "Pasted Teams notes.",
      endedAt: "2026-04-24T11:00",
      occurredAt: "2026-04-24T10:00",
      participantPersonIds: ["person_1"],
      primaryCompanyId: "",
      sensitivity: "NORMAL",
      summary: "Manual summary.",
      title: "Client meeting",
    });
    const invalid = pastedMeetingCaptureFormSchema.safeParse({
      body: "Pasted Teams notes.",
      endedAt: "2026-04-24T09:00",
      occurredAt: "2026-04-24T10:00",
      participantPersonIds: [],
      primaryCompanyId: "",
      sensitivity: "NORMAL",
      summary: "",
      title: "Client meeting",
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
    expect(invalid.error?.flatten().fieldErrors.endedAt?.[0]).toContain(
      "End time",
    );
  });
});
