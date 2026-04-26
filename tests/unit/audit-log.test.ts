import { describe, expect, it } from "vitest";

import { sanitizeAuditMetadata } from "@/server/services/audit-log";

describe("audit log metadata sanitization", () => {
  it("removes sensitive keys and redacts sensitive values", () => {
    const metadata = sanitizeAuditMetadata({
      databaseUrl: "postgresql://user:password@localhost:5432/pobal",
      allowed: "kept",
      nested: {
        sessionToken: "secret-session-value",
        note: "safe",
      },
    });

    const serialized = JSON.stringify(metadata);

    expect(serialized).toContain("kept");
    expect(serialized).toContain("safe");
    expect(serialized).not.toContain("postgresql://");
    expect(serialized).not.toContain("secret-session-value");
    expect(serialized).not.toContain("sessionToken");
  });

  it("redacts content-bearing keys and suspicious credential values", () => {
    const metadata = sanitizeAuditMetadata({
      auditSafe: {
        bodyLength: 42,
        transcriptLength: 120,
      },
      editedTranscriptText: "Voice transcript should not be written.",
      headers: {
        authorization: "Bearer secret-token-value",
      },
      noteBody: "Note body should not be written.",
      providerPayload: {
        raw: "provider response",
      },
      proposedPatch: {
        title: "Sensitive proposed patch",
      },
      stripeSecret: ["sk", "live", "abcdefghijklmnopqrstuvwxyz"].join("_"),
    });
    const serialized = JSON.stringify(metadata);

    expect(serialized).toContain("bodyLength");
    expect(serialized).toContain("transcriptLength");
    expect(serialized).not.toContain("Voice transcript should not be written");
    expect(serialized).not.toContain("Note body should not be written");
    expect(serialized).not.toContain("provider response");
    expect(serialized).not.toContain("Sensitive proposed patch");
    expect(serialized).not.toContain("abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("Bearer secret-token-value");
  });

  it("bounds long strings, arrays, and nested objects", () => {
    const metadata = sanitizeAuditMetadata({
      items: Array.from({ length: 25 }, (_, index) => `item-${index}`),
      longValue: "long audit metadata value ".repeat(35),
      nested: {
        one: {
          two: {
            three: {
              four: {
                five: "too deep",
              },
            },
          },
        },
      },
    });
    const serialized = JSON.stringify(metadata);

    expect(serialized).toContain("...");
    expect(serialized).toContain("[object]");
    expect(serialized).not.toContain("item-24");
    expect(serialized).not.toContain("too deep");
  });
});
