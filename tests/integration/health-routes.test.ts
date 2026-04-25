import { describe, expect, it } from "vitest";

import { GET as health } from "@/app/api/health/route";
import { GET as ready } from "@/app/api/ready/route";

function restoreEnvValue(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

describe("foundation route handlers", () => {
  it("returns health status", async () => {
    const response = health();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      service: "pobal",
    });
  });

  it("reports readiness from runtime environment", async () => {
    const previousAuthSecret = process.env.AUTH_SECRET;
    const previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.AUTH_SECRET = "test-auth-secret";
    process.env.DATABASE_URL =
      "postgresql://pobal:pobal@localhost:5432/pobal?schema=public";

    try {
      const response = ready();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe("ready");
    } finally {
      restoreEnvValue("AUTH_SECRET", previousAuthSecret);
      restoreEnvValue("DATABASE_URL", previousDatabaseUrl);
    }
  });

  it("fails readiness safely without exposing environment values", async () => {
    const previousAuthSecret = process.env.AUTH_SECRET;
    const previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.AUTH_SECRET = "super-secret-test-value";
    delete process.env.DATABASE_URL;

    try {
      const response = ready();
      const body = await response.json();
      const serialized = JSON.stringify(body);

      expect(response.status).toBe(503);
      expect(body.status).toBe("not_ready");
      expect(serialized).not.toContain("postgresql://");
      expect(serialized).not.toContain("AUTH_SECRET");
      expect(serialized).not.toContain("super-secret-test-value");
      expect(serialized).not.toContain("OPENAI_API_KEY");
    } finally {
      restoreEnvValue("AUTH_SECRET", previousAuthSecret);
      restoreEnvValue("DATABASE_URL", previousDatabaseUrl);
    }
  });
});
