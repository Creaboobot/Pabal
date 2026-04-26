// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  AUDIT_LOG_VIEWER_DEFAULT_LIMIT,
  AUDIT_LOG_VIEWER_MAX_LIMIT,
  normalizeAuditLogViewerFilters,
  sanitizeAuditMetadataForViewer,
} from "@/server/services/audit-log-viewer";

describe("audit log viewer metadata sanitizer", () => {
  it("redacts sensitive metadata keys", () => {
    const metadata = sanitizeAuditMetadataForViewer({
      changedFields: ["name"],
      noteBody: "This note body must not display.",
      proposedPatch: {
        title: "Do not show patch JSON",
      },
      token: "secret-token-value",
    });

    expect(metadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "noteBody",
          redacted: true,
          value: "[redacted]",
        }),
        expect.objectContaining({
          key: "proposedPatch",
          redacted: true,
          value: "[redacted]",
        }),
        expect.objectContaining({
          key: "token",
          redacted: true,
          value: "[redacted]",
        }),
      ]),
    );
    expect(JSON.stringify(metadata)).not.toContain("This note body");
    expect(JSON.stringify(metadata)).not.toContain("Do not show patch JSON");
  });

  it("redacts suspicious secret-looking values", () => {
    const metadata = sanitizeAuditMetadataForViewer({
      connection: "postgresql://user:password@localhost:5432/app",
      providerKey: "sk-test-1234567890abcdef1234567890abcdef",
      safeValue: "changedFields",
    });

    expect(metadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "connection",
          redacted: true,
          value: "[redacted]",
        }),
        expect.objectContaining({
          key: "providerKey",
          redacted: true,
          value: "[redacted]",
        }),
        expect.objectContaining({
          key: "safeValue",
          redacted: false,
          value: "changedFields",
        }),
      ]),
    );
  });

  it("truncates long values", () => {
    const metadata = sanitizeAuditMetadataForViewer({
      summary: "a".repeat(240),
    });

    expect(metadata[0]).toMatchObject({
      key: "summary",
      redacted: false,
      truncated: true,
    });
    expect(metadata[0]?.value.length).toBeLessThan(180);
  });

  it("summarizes arrays and nested objects safely", () => {
    const metadata = sanitizeAuditMetadataForViewer({
      changedFields: ["name", "status", "priority", "sensitivity"],
      nested: {
        headers: {
          authorization: "Bearer abc",
        },
        safe: {
          first: "one",
          second: "two",
        },
      },
    });

    expect(metadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "changedFields",
          truncated: true,
        }),
        expect.objectContaining({
          key: "nested",
        }),
      ]),
    );
    expect(JSON.stringify(metadata)).not.toContain("Bearer abc");
  });
});

describe("audit log viewer filter normalization", () => {
  it("bounds limits and parses supported filters", () => {
    const filters = normalizeAuditLogViewerFilters({
      action: "task.created",
      actorUserId: "user_test_1",
      entityType: "Task",
      from: "2026-04-20",
      limit: "999",
      to: "2026-04-26",
    });

    expect(filters).toMatchObject({
      action: "task.created",
      actorUserId: "user_test_1",
      entityType: "Task",
      limit: AUDIT_LOG_VIEWER_MAX_LIMIT,
    });
    expect(filters.from).toBeInstanceOf(Date);
    expect(filters.to).toBeInstanceOf(Date);
  });

  it("uses default limit and ignores invalid dates", () => {
    const filters = normalizeAuditLogViewerFilters({
      from: "not-a-date",
      limit: "not-a-number",
      to: "also-not-a-date",
    });

    expect(filters.limit).toBe(AUDIT_LOG_VIEWER_DEFAULT_LIMIT);
    expect(filters.from).toBeUndefined();
    expect(filters.to).toBeUndefined();
  });
});
