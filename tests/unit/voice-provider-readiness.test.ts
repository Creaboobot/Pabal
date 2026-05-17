import { describe, expect, it } from "vitest";

import {
  getSpeechToTextProviderReadiness,
  getTranscriptStructuringProviderReadiness,
  getVoiceProviderReadiness,
} from "@/server/services/voice-provider-readiness";

describe("voice provider readiness", () => {
  it("uses local configuration only for missing OpenAI readiness", () => {
    const readiness = getVoiceProviderReadiness({
      NODE_ENV: "test",
    });

    expect(readiness.speechToText).toMatchObject({
      available: false,
      providerLabel: "OpenAI",
      status: "requires_configuration",
    });
    expect(readiness.transcriptStructuring).toMatchObject({
      available: false,
      providerLabel: "OpenAI",
      status: "requires_configuration",
    });
  });

  it("marks configured OpenAI providers available without exposing secrets", () => {
    const readiness = getVoiceProviderReadiness({
      NODE_ENV: "test",
      OPENAI_API_KEY: "secret-key-that-must-not-render",
    });
    const serialized = JSON.stringify(readiness);

    expect(readiness.speechToText.status).toBe("available");
    expect(readiness.transcriptStructuring.status).toBe("available");
    expect(serialized).not.toContain("secret-key-that-must-not-render");
  });

  it("labels mock speech-to-text as demo transcription outside production", () => {
    const readiness = getSpeechToTextProviderReadiness({
      NODE_ENV: "test",
      SPEECH_TO_TEXT_PROVIDER: "mock",
    });

    expect(readiness).toMatchObject({
      available: true,
      badgeLabel: "Demo transcription mode",
      isDemo: true,
      providerLabel: "Mock",
      status: "demo",
    });
    expect(readiness.detail).toContain("This is not real transcription.");
  });

  it("labels mock transcript structuring as demo mode outside production", () => {
    const readiness = getTranscriptStructuringProviderReadiness({
      NODE_ENV: "test",
      TRANSCRIPT_STRUCTURING_PROVIDER: "mock",
    });

    expect(readiness).toMatchObject({
      available: true,
      isDemo: true,
      providerLabel: "Mock",
      status: "demo",
    });
    expect(readiness.detail).toContain(
      "This is not real transcript structuring.",
    );
  });

  it("rejects mock provider readiness in production", () => {
    const readiness = getVoiceProviderReadiness({
      NODE_ENV: "production",
      SPEECH_TO_TEXT_PROVIDER: "mock",
      TRANSCRIPT_STRUCTURING_PROVIDER: "mock",
    });

    expect(readiness.speechToText).toMatchObject({
      available: false,
      providerLabel: "Mock",
      status: "misconfigured",
    });
    expect(readiness.transcriptStructuring).toMatchObject({
      available: false,
      providerLabel: "Mock",
      status: "misconfigured",
    });
  });

  it("does not echo unsupported provider names", () => {
    const readiness = getVoiceProviderReadiness({
      NODE_ENV: "test",
      SPEECH_TO_TEXT_PROVIDER: "unknown-provider",
      TRANSCRIPT_STRUCTURING_PROVIDER: "unknown-provider",
    });
    const serialized = JSON.stringify(readiness);

    expect(readiness.speechToText).toMatchObject({
      available: false,
      providerLabel: "Unsupported provider",
      status: "misconfigured",
    });
    expect(readiness.transcriptStructuring).toMatchObject({
      available: false,
      providerLabel: "Unsupported provider",
      status: "misconfigured",
    });
    expect(serialized).not.toContain("unknown-provider");
  });
});
