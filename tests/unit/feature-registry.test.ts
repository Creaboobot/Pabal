import { describe, expect, it } from "vitest";

import { buildFeatureReadinessCards } from "@/server/services/feature-registry";

describe("feature readiness registry", () => {
  it("renders readiness states without billing entitlements", () => {
    const features = buildFeatureReadinessCards({
      FEATURE_BILLING: false,
      FEATURE_LINKEDIN_MANUAL_ENRICHMENT: true,
      FEATURE_MICROSOFT_GRAPH: false,
      FEATURE_VOICE_CAPTURE: true,
      NODE_ENV: "test",
    });

    expect(features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "voice-capture",
          status: "enabled",
        }),
        expect.objectContaining({
          key: "linkedin-manual-enrichment",
          status: "manual_only",
        }),
        expect.objectContaining({
          key: "billing-readiness",
          status: "readiness_only",
        }),
      ]),
    );
  });

  it("distinguishes voice provider readiness without an OpenAI key", () => {
    const features = buildFeatureReadinessCards({
      NODE_ENV: "test",
    });

    expect(features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "speech-to-text-provider",
          status: "requires_configuration",
        }),
        expect.objectContaining({
          key: "transcript-structuring-provider",
          status: "requires_configuration",
        }),
      ]),
    );
  });

  it("labels mock voice providers as demo mode", () => {
    const features = buildFeatureReadinessCards({
      NODE_ENV: "test",
      SPEECH_TO_TEXT_PROVIDER: "mock",
      TRANSCRIPT_STRUCTURING_PROVIDER: "mock",
    });

    expect(features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "speech-to-text-provider",
          status: "demo_mode",
        }),
        expect.objectContaining({
          key: "transcript-structuring-provider",
          status: "demo_mode",
        }),
      ]),
    );
  });
});
