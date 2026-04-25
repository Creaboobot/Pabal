import { describe, expect, it } from "vitest";

import { proposedPatchPreviewRows } from "@/modules/proposals/patch-preview";
import {
  proposalIdSchema,
  proposalItemReviewSchema,
} from "@/modules/proposals/validation";
import { rollupAIProposalStatus } from "@/server/services/ai-proposals";

describe("proposal review helpers", () => {
  it("rolls up proposal status deterministically", () => {
    expect(
      rollupAIProposalStatus([
        { status: "PENDING_REVIEW" },
        { status: "PENDING_REVIEW" },
      ]),
    ).toBe("PENDING_REVIEW");
    expect(
      rollupAIProposalStatus([
        { status: "PENDING_REVIEW" },
        { status: "APPROVED" },
      ]),
    ).toBe("IN_REVIEW");
    expect(
      rollupAIProposalStatus([
        { status: "APPROVED" },
        { status: "APPROVED" },
      ]),
    ).toBe("APPROVED");
    expect(
      rollupAIProposalStatus([
        { status: "REJECTED" },
        { status: "REJECTED" },
      ]),
    ).toBe("REJECTED");
    expect(
      rollupAIProposalStatus([
        { status: "APPROVED" },
        { status: "REJECTED" },
        { status: "NEEDS_CLARIFICATION" },
      ]),
    ).toBe("PARTIALLY_APPROVED");
    expect(
      rollupAIProposalStatus([{ status: "NEEDS_CLARIFICATION" }]),
    ).toBe("IN_REVIEW");
  });

  it("validates proposal action ids", () => {
    expect(
      proposalItemReviewSchema.safeParse({
        proposalId: "proposal_test_1",
        proposalItemId: "item_test_1",
      }).success,
    ).toBe(true);
    expect(proposalIdSchema.safeParse({ proposalId: "" }).success).toBe(false);
    expect(
      proposalItemReviewSchema.safeParse({
        proposalId: "proposal_test_1",
        proposalItemId: "",
      }).success,
    ).toBe(false);
  });

  it("previews proposed patches without exposing sensitive values", () => {
    const rows = proposedPatchPreviewRows({
      apiKey: "sk-test-secret",
      description:
        "This is a safe but very long proposed description. ".repeat(8),
      nested: {
        title: "<script>alert('xss')</script>",
      },
      phone: "+4512345678",
    });
    const serialized = JSON.stringify(rows);

    expect(serialized).toContain("[redacted]");
    expect(serialized).not.toContain("sk-test-secret");
    expect(serialized).not.toContain("+4512345678");
    expect(serialized).not.toContain("<script>");
    expect(serialized).toContain("&lt;script&gt;");
    expect(
      rows.find((row) => row.key === "description")?.value.length,
    ).toBeLessThanOrEqual(160);
  });

  it("handles unexpected proposed patch shapes", () => {
    expect(proposedPatchPreviewRows(null)).toEqual([
      { key: "value", masked: false, value: "null" },
    ]);
    expect(proposedPatchPreviewRows(["a", "b"])).toEqual([
      { key: "value", masked: false, value: "[2 items]" },
    ]);
  });
});
