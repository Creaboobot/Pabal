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
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_ENV: "production",
      OPENAI_TRANSCRIPTION_MODEL: "gpt-4o-mini-transcribe",
      OPENAI_STRUCTURING_MODEL: "gpt-4o-mini",
      SPEECH_TO_TEXT_PROVIDER: "openai",
      TRANSCRIPT_STRUCTURING_PROVIDER: "openai",
    });

    expect(parsed.success).toBe(true);
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
