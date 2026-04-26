// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import {
  getSpeechToTextProvider,
  MockSpeechToTextProvider,
  OpenAISpeechToTextProvider,
  SpeechToTextProviderConfigurationError,
  SpeechToTextProviderError,
} from "@/server/providers/speech-to-text";

function testAudio() {
  return new File([new Uint8Array([1, 2, 3])], "voice-note.webm", {
    type: "audio/webm",
  });
}

describe("speech-to-text providers", () => {
  it("selects the mock provider only when explicitly configured outside production", () => {
    const provider = getSpeechToTextProvider({
      env: {
        NODE_ENV: "test",
        SPEECH_TO_TEXT_PROVIDER: "mock",
      } as NodeJS.ProcessEnv,
    });

    expect(provider).toBeInstanceOf(MockSpeechToTextProvider);
  });

  it("defaults to the OpenAI provider without requiring an API key at build time", () => {
    const provider = getSpeechToTextProvider({
      env: {
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv,
    });

    expect(provider).toBeInstanceOf(OpenAISpeechToTextProvider);
  });

  it("rejects the mock provider in production", () => {
    expect(() =>
      getSpeechToTextProvider({
        env: {
          NODE_ENV: "production",
          SPEECH_TO_TEXT_PROVIDER: "mock",
        } as NodeJS.ProcessEnv,
      }),
    ).toThrow(SpeechToTextProviderConfigurationError);
  });

  it("returns deterministic mock transcription output", async () => {
    const provider = new MockSpeechToTextProvider({
      confidence: 0.87,
      language: "en",
      text: "Mocked local transcript",
    });

    await expect(
      provider.transcribe({
        audio: testAudio(),
        fileName: "voice-note.webm",
        mimeType: "audio/webm",
        sizeBytes: 3,
      }),
    ).resolves.toEqual({
      confidence: 0.87,
      language: "en",
      text: "Mocked local transcript",
    });
  });

  it("fails safely when the OpenAI API key is missing at runtime", async () => {
    const provider = new OpenAISpeechToTextProvider();

    await expect(
      provider.transcribe({
        audio: testAudio(),
        fileName: "voice-note.webm",
        mimeType: "audio/webm",
        sizeBytes: 3,
      }),
    ).rejects.toMatchObject({
      code: "missing_api_key",
      safeMessage: "Voice transcription provider is not configured.",
    } satisfies Partial<SpeechToTextProviderError>);
  });

  it("normalizes the OpenAI transcription response behind the adapter", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          confidence: 0.74,
          language: "en",
          text: "  Provider transcript  ",
        }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 200,
        },
      );
    });
    const provider = new OpenAISpeechToTextProvider({
      apiKey: "test-key",
      fetchImpl,
      model: "test-transcribe-model",
    });

    await expect(
      provider.transcribe({
        audio: testAudio(),
        fileName: "voice-note.webm",
        mimeType: "audio/webm",
        sizeBytes: 3,
      }),
    ).resolves.toEqual({
      confidence: 0.74,
      language: "en",
      text: "Provider transcript",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
