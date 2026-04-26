import {
  SpeechToTextProviderError,
  type SpeechToTextInput,
  type SpeechToTextProvider,
  type SpeechToTextResult,
} from "@/server/providers/speech-to-text/types";

export const DEFAULT_OPENAI_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";

type OpenAISpeechToTextProviderInput = {
  apiKey?: string | null | undefined;
  fetchImpl?: typeof fetch | undefined;
  model?: string | null | undefined;
};

type OpenAITranscriptionResponse = {
  confidence?: unknown;
  language?: unknown;
  text?: unknown;
};

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function optionalConfidence(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export class OpenAISpeechToTextProvider implements SpeechToTextProvider {
  readonly name = "openai";
  private readonly apiKey: string | null | undefined;
  private readonly fetchImpl: typeof fetch;
  private readonly model: string;

  constructor(input: OpenAISpeechToTextProviderInput = {}) {
    this.apiKey = input.apiKey;
    this.fetchImpl = input.fetchImpl ?? fetch;
    this.model =
      input.model?.trim() || DEFAULT_OPENAI_TRANSCRIPTION_MODEL;
  }

  async transcribe(input: SpeechToTextInput): Promise<SpeechToTextResult> {
    if (!this.apiKey) {
      throw new SpeechToTextProviderError({
        code: "missing_api_key",
        safeMessage: "Voice transcription provider is not configured.",
        statusCode: 503,
      });
    }

    const formData = new FormData();
    formData.set("model", this.model);
    formData.set("file", input.audio, input.fileName);

    const response = await this.fetchImpl(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        body: formData,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new SpeechToTextProviderError({
        code: "provider_request_failed",
        safeMessage: "Voice transcription failed at the provider.",
        statusCode: response.status,
      });
    }

    const payload = (await response.json()) as OpenAITranscriptionResponse;
    const text = optionalString(payload.text);

    if (!text) {
      throw new SpeechToTextProviderError({
        code: "provider_empty_transcript",
        safeMessage: "Voice transcription returned no transcript.",
        statusCode: 502,
      });
    }

    return {
      confidence: optionalConfidence(payload.confidence),
      language: optionalString(payload.language),
      text,
    };
  }
}
