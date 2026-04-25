import { describe, expect, it } from "vitest";

import { getReadinessStatus, readRuntimeEnv } from "@/server/config/env";

describe("runtime environment validation", () => {
  it("allows missing production secrets during build-time validation", () => {
    const parsed = readRuntimeEnv({
      NODE_ENV: "production",
    });

    expect(parsed.success).toBe(true);
  });

  it("marks readiness unavailable when DATABASE_URL is missing", () => {
    const readiness = getReadinessStatus({
      NODE_ENV: "production",
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.checks).toContainEqual({
      name: "database-url",
      ok: false,
    });
  });

  it("marks readiness available with a database URL", () => {
    const readiness = getReadinessStatus({
      DATABASE_URL:
        "postgresql://pobal:pobal@localhost:5432/pobal?schema=public",
      NODE_ENV: "production",
    });

    expect(readiness.ready).toBe(true);
  });
});
