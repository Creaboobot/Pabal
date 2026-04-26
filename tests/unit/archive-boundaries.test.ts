// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("archive and retention boundaries", () => {
  it("does not add permanent deletion, retention, or purge routes", () => {
    const disallowedRoutes = [
      "app/api/privacy/delete/route.ts",
      "app/api/privacy/retention/route.ts",
      "app/api/settings/archive/delete/route.ts",
      "app/api/settings/archive/purge/route.ts",
      "app/api/settings/archive/retention/route.ts",
      "app/(app)/settings/archive/delete/page.tsx",
      "app/(app)/settings/archive/retention/page.tsx",
    ];

    for (const route of disallowedRoutes) {
      expect(existsSync(join(root, route))).toBe(false);
    }
  });

  it("keeps archive management free of hard deletion and jobs", () => {
    const service = readFileSync(
      join(root, "server/services/archive-management.ts"),
      "utf8",
    );
    const repository = readFileSync(
      join(root, "server/repositories/archive-management.ts"),
      "utf8",
    );
    const combined = `${service}\n${repository}`;

    expect(combined).not.toContain(".delete(");
    expect(combined).not.toContain(".deleteMany(");
    expect(combined).not.toContain("JOB_PROVIDER");
    expect(combined).not.toContain("Inngest");
    expect(combined).not.toContain("createWriteStream");
    expect(combined).not.toContain("createReadStream");
  });

  it("does not expose unsupported archive record types for restore", () => {
    const service = readFileSync(
      join(root, "server/services/archive-management.ts"),
      "utf8",
    );

    expect(service).not.toContain("auditLogs");
    expect(service).not.toContain("memberships");
    expect(service).not.toContain("sourceReferences");
    expect(service).not.toContain("aiProposalItems");
    expect(service).not.toContain("voiceMentions");
  });
});
