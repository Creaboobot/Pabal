// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("V1 review documentation readiness", () => {
  it("includes a walkthrough for the main review flows and boundaries", () => {
    const walkthroughPath = "docs/review/v1-review-walkthrough.md";

    expect(existsSync(join(root, walkthroughPath))).toBe(true);

    const walkthrough = readRepoFile(walkthroughPath);

    for (const route of [
      "/today",
      "/search",
      "/people",
      "/meetings",
      "/notes",
      "/tasks",
      "/commitments",
      "/opportunities",
      "/proposals",
      "/voice-notes",
      "/settings/governance",
      "/settings/privacy",
      "/settings/archive",
    ]) {
      expect(walkthrough).toContain(route);
    }

    expect(walkthrough).toMatch(/No semantic search, pgvector,\s*embeddings/i);
    expect(walkthrough).toMatch(/no proposal application engine/i);
    expect(walkthrough).toMatch(/no live Microsoft Graph sync/i);
    expect(walkthrough).toMatch(/no live LinkedIn integration/i);
    expect(walkthrough).toMatch(/no live Stripe checkout/i);
    expect(walkthrough).toMatch(/no.*permanent deletion/i);
  });

  it("keeps README search copy framed as structured keyword search only", () => {
    const readme = readRepoFile("README.md");

    expect(readme).toMatch(/Search is structured keyword search only/i);
    expect(readme).toMatch(/does not use semantic\s*ranking, pgvector, embeddings/i);
    expect(readme).not.toMatch(/PostgreSQL \+ pgvector/);
    expect(readme).not.toMatch(/semantic search is implemented/i);
  });

  it("documents local review seeding without provider calls", () => {
    const localDevelopment = readRepoFile("docs/development/local-development.md");

    expect(localDevelopment).toContain("SEED_DEMO_DATA=true");
    expect(localDevelopment).toMatch(/deterministic V1 review workspace/i);
    expect(localDevelopment).toMatch(/does not call AI, transcription, Microsoft, LinkedIn, billing/i);
  });
});
