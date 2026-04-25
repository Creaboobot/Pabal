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
});
