import { describe, expect, it } from "vitest";

import { GET as health } from "@/app/api/health/route";
import { GET as ready } from "@/app/api/ready/route";

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
    const previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL =
      "postgresql://pobal:pobal@localhost:5432/pobal?schema=public";

    try {
      const response = ready();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe("ready");
    } finally {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });
});
