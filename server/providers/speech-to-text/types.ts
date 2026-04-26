export const speechToTextProviderNames = ["openai", "mock"] as const;

export type SpeechToTextProviderName =
  (typeof speechToTextProviderNames)[number];

export type SpeechToTextInput = {
  audio: File;
  durationSeconds?: number | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type SpeechToTextResult = {
  confidence?: number | null;
  language?: string | null;
  text: string;
};

export class SpeechToTextProviderError extends Error {
  readonly code: string;
  readonly safeMessage: string;
  readonly statusCode: number | undefined;

  constructor(input: {
    code: string;
    message?: string;
    safeMessage: string;
    statusCode?: number;
  }) {
    super(input.message ?? input.safeMessage);
    this.name = "SpeechToTextProviderError";
    this.code = input.code;
    this.safeMessage = input.safeMessage;
    this.statusCode = input.statusCode;
  }
}

export class SpeechToTextProviderConfigurationError extends SpeechToTextProviderError {
  constructor(message: string) {
    super({
      code: "provider_configuration_error",
      message,
      safeMessage: "Voice transcription is not configured.",
      statusCode: 503,
    });
    this.name = "SpeechToTextProviderConfigurationError";
  }
}

export type SpeechToTextProvider = {
  name: SpeechToTextProviderName;
  transcribe(input: SpeechToTextInput): Promise<SpeechToTextResult>;
};
