// @vitest-environment node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("LinkedIn manual enrichment boundary", () => {
  it("does not add LinkedIn provider, API, scraper, or job surfaces", () => {
    const root = process.cwd();

    expect(existsSync(join(root, "server", "providers", "linkedin"))).toBe(
      false,
    );
    expect(existsSync(join(root, "app", "api", "linkedin"))).toBe(false);
    expect(existsSync(join(root, "server", "jobs", "linkedin"))).toBe(false);
    expect(existsSync(join(root, "app", "api", "scrape"))).toBe(false);
  });
});
