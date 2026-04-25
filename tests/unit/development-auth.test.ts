import { describe, expect, it } from "vitest";

import { isDevelopmentAuthEnabled } from "@/server/services/development-auth";

describe("development auth gate", () => {
  it("requires explicit enablement outside production", () => {
    expect(
      isDevelopmentAuthEnabled({
        ENABLE_DEV_AUTH: "true",
        NODE_ENV: "development",
      }),
    ).toBe(true);
  });

  it("cannot be enabled in production", () => {
    expect(
      isDevelopmentAuthEnabled({
        ENABLE_DEV_AUTH: "true",
        NODE_ENV: "production",
      }),
    ).toBe(false);
  });

  it("stays disabled without the explicit flag", () => {
    expect(
      isDevelopmentAuthEnabled({
        NODE_ENV: "development",
      }),
    ).toBe(false);
  });
});
