import { getRuntimeEnv } from "@/server/config/env";
import { MockSpeechToTextProvider } from "@/server/providers/speech-to-text/mock";
import {
  DEFAULT_OPENAI_TRANSCRIPTION_MODEL,
  OpenAISpeechToTextProvider,
} from "@/server/providers/speech-to-text/openai";
import {
  SpeechToTextProviderConfigurationError,
  speechToTextProviderNames,
  type SpeechToTextProvider,
  type SpeechToTextProviderName,
} from "@/server/providers/speech-to-text/types";

export {
  MockSpeechToTextProvider,
  OpenAISpeechToTextProvider,
  DEFAULT_OPENAI_TRANSCRIPTION_MODEL,
};
export type {
  SpeechToTextInput,
  SpeechToTextProvider,
  SpeechToTextProviderName,
  SpeechToTextResult,
} from "@/server/providers/speech-to-text/types";
export {
  SpeechToTextProviderConfigurationError,
  SpeechToTextProviderError,
} from "@/server/providers/speech-to-text/types";

export const DEFAULT_SPEECH_TO_TEXT_PROVIDER: SpeechToTextProviderName =
  "openai";

type SpeechToTextProviderFactoryInput = {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
};

function isSpeechToTextProviderName(
  value: string,
): value is SpeechToTextProviderName {
  return speechToTextProviderNames.includes(
    value as SpeechToTextProviderName,
  );
}

export function getSpeechToTextProvider(
  input: SpeechToTextProviderFactoryInput = {},
): SpeechToTextProvider {
  const env = getRuntimeEnv(input.env);
  const configuredName =
    env.SPEECH_TO_TEXT_PROVIDER ?? DEFAULT_SPEECH_TO_TEXT_PROVIDER;

  if (!isSpeechToTextProviderName(configuredName)) {
    throw new SpeechToTextProviderConfigurationError(
      `Unsupported speech-to-text provider: ${configuredName}`,
    );
  }

  if (configuredName === "mock") {
    if (env.NODE_ENV === "production") {
      throw new SpeechToTextProviderConfigurationError(
        "Mock speech-to-text provider is not allowed in production",
      );
    }

    return new MockSpeechToTextProvider();
  }

  return new OpenAISpeechToTextProvider({
    apiKey: env.OPENAI_API_KEY,
    fetchImpl: input.fetchImpl,
    model: env.OPENAI_TRANSCRIPTION_MODEL ?? DEFAULT_OPENAI_TRANSCRIPTION_MODEL,
  });
}
