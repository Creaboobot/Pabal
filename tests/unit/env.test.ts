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
      AUTH_SECRET: "test-auth-secret",
      NODE_ENV: "production",
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.checks).toContainEqual({
      name: "database-url",
      ok: false,
    });
  });

  it("does not require provider secrets for runtime shape validation", () => {
    const parsed = readRuntimeEnv({
      APP_URL: "http://localhost:3000",
      DATABASE_URL:
        "postgresql://pobal:pobal@localhost:5432/pobal?schema=public",
      FEATURE_BILLING: "false",
      FEATURE_LINKEDIN_MANUAL_ENRICHMENT: "true",
      FEATURE_MICROSOFT_GRAPH: "false",
      FEATURE_VOICE_CAPTURE: "true",
      BILLING_PROVIDER: "disabled",
      MICROSOFT_GRAPH_PROVIDER: "disabled",
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_ENV: "production",
      OPENAI_TRANSCRIPTION_MODEL: "gpt-4o-mini-transcribe",
      OPENAI_STRUCTURING_MODEL: "gpt-4o-mini",
      SPEECH_TO_TEXT_PROVIDER: "openai",
      TRANSCRIPT_STRUCTURING_PROVIDER: "openai",
    });

    expect(parsed.success).toBe(true);
  });

  it("does not require Microsoft Graph configuration for readiness", () => {
    const readiness = getReadinessStatus({
      AUTH_SECRET: "test-auth-secret",
      DATABASE_URL:
        "postgresql://pobal:pobal@localhost:5432/pobal?schema=public",
      FEATURE_MICROSOFT_GRAPH: "false",
      NODE_ENV: "production",
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.checks).not.toContainEqual({
      name: "microsoft-graph",
      ok: false,
    });
  });

  it("accepts optional Microsoft Graph readiness variables without requiring secrets", () => {
    const parsed = readRuntimeEnv({
      MICROSOFT_GRAPH_AUTHORITY: "https://login.microsoftonline.com/common",
      MICROSOFT_GRAPH_PROVIDER: "disabled",
      MICROSOFT_GRAPH_REDIRECT_URI:
        "http://localhost:3000/api/integrations/microsoft/callback",
      NODE_ENV: "development",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts optional billing readiness variables without requiring Stripe secrets", () => {
    const parsed = readRuntimeEnv({
      BILLING_PROVIDER: "disabled",
      NODE_ENV: "production",
    });

    expect(parsed.success).toBe(true);
  });

  it("does not require Stripe configuration for readiness", () => {
    const readiness = getReadinessStatus({
      AUTH_SECRET: "test-auth-secret",
      BILLING_PROVIDER: "disabled",
      DATABASE_URL:
        "postgresql://pobal:pobal@localhost:5432/pobal?schema=public",
      NODE_ENV: "production",
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.checks).not.toContainEqual({
      name: "stripe",
      ok: false,
    });
  });

  it("marks readiness available with a database URL", () => {
    const readiness = getReadinessStatus({
      AUTH_SECRET: "test-auth-secret",
      DATABASE_URL:
        "postgresql://pobal:pobal@localhost:5432/pobal?schema=public",
      NODE_ENV: "production",
    });

    expect(readiness.ready).toBe(true);
  });
});
