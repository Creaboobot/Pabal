// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("privacy export boundaries", () => {
  it("does not add deletion, retention, CSV, ZIP, or external export routes", () => {
    const disallowedRoutes = [
      "app/api/privacy/delete/route.ts",
      "app/api/privacy/retention/route.ts",
      "app/api/privacy/exports/csv/route.ts",
      "app/api/privacy/exports/zip/route.ts",
      "app/api/privacy/exports/storage/route.ts",
      "app/api/privacy/exports/scheduled/route.ts",
      "app/(app)/settings/privacy/delete/page.tsx",
      "app/(app)/settings/privacy/retention/page.tsx",
    ];

    for (const route of disallowedRoutes) {
      expect(existsSync(join(root, route))).toBe(false);
    }
  });

  it("keeps exports synchronous without background job or external storage writes", () => {
    const service = readFileSync(
      join(root, "server/services/data-export.ts"),
      "utf8",
    );
    const repository = readFileSync(
      join(root, "server/repositories/data-export.ts"),
      "utf8",
    );
    const combined = `${service}\n${repository}`;

    expect(combined).not.toContain("JOB_PROVIDER");
    expect(combined).not.toContain("Inngest");
    expect(combined).not.toContain("upload");
    expect(combined).not.toContain("createWriteStream");
    expect(combined).not.toContain("createReadStream");
  });

  it("does not export Auth.js token tables or raw voice audio storage keys", () => {
    const repository = readFileSync(
      join(root, "server/repositories/data-export.ts"),
      "utf8",
    );

    expect(repository).not.toContain("db.account");
    expect(repository).not.toContain("db.session");
    expect(repository).not.toContain("verificationToken");
    expect(repository).not.toContain("access_token");
    expect(repository).not.toContain("refresh_token");
    expect(repository).not.toContain("audioStorageKey: true");
  });
});
