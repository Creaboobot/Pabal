import { describe, expect, it } from "vitest";

import { taskFormSchema } from "@/modules/tasks/validation";

const validTask = {
  commitmentId: "",
  companyId: "",
  description: "Follow up on the operating model discussion.",
  dueAt: "2026-04-24T10:00",
  introductionSuggestionId: "",
  meetingId: "",
  noteId: "",
  personId: "",
  priority: "HIGH",
  reminderAt: "2026-04-23T10:00",
  snoozedUntil: "",
  status: "OPEN",
  taskType: "FOLLOW_UP",
  title: "Send Signavio example",
  whyNowRationale: "The client asked for a concrete example.",
};

describe("task validation", () => {
  it("accepts a valid manual follow-up task", () => {
    const parsed = taskFormSchema.safeParse(validTask);

    expect(parsed.success).toBe(true);
  });

  it("rejects missing title and invalid enum values", () => {
    const parsed = taskFormSchema.safeParse({
      ...validTask,
      priority: "URGENT",
      status: "STARTED",
      taskType: "CALL",
      title: "",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.title?.[0]).toContain(
      "required",
    );
    expect(parsed.error?.flatten().fieldErrors.priority).toBeDefined();
    expect(parsed.error?.flatten().fieldErrors.status).toBeDefined();
    expect(parsed.error?.flatten().fieldErrors.taskType).toBeDefined();
  });

  it("rejects reminder dates after the due date", () => {
    const parsed = taskFormSchema.safeParse({
      ...validTask,
      dueAt: "2026-04-24T10:00",
      reminderAt: "2026-04-25T10:00",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.reminderAt?.[0]).toContain(
      "Reminder date",
    );
  });

  it("rejects overlong description and why-now rationale", () => {
    const parsed = taskFormSchema.safeParse({
      ...validTask,
      description: "a".repeat(4001),
      whyNowRationale: "b".repeat(2001),
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.description).toBeDefined();
    expect(parsed.error?.flatten().fieldErrors.whyNowRationale).toBeDefined();
  });
});
