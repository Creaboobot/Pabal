// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("middleware route protection", () => {
  it("protects nested settings routes including integrations", () => {
    const middlewarePath = fileURLToPath(
      new URL("../../middleware.ts", import.meta.url),
    );
    const source = readFileSync(middlewarePath, "utf8");

    expect(source).toContain("\"/settings/:path*\"");
  });
});
