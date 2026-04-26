import { getRuntimeEnv } from "@/server/config/env";
import { MockTranscriptStructuringProvider } from "@/server/providers/transcript-structuring/mock";
import {
  DEFAULT_OPENAI_STRUCTURING_MODEL,
  OpenAITranscriptStructuringProvider,
} from "@/server/providers/transcript-structuring/openai";
import {
  transcriptStructuringProviderNames,
  TranscriptStructuringProviderConfigurationError,
  type TranscriptStructuringProvider,
  type TranscriptStructuringProviderName,
} from "@/server/providers/transcript-structuring/types";

export {
  DEFAULT_OPENAI_STRUCTURING_MODEL,
  MockTranscriptStructuringProvider,
  OpenAITranscriptStructuringProvider,
};
export type {
  TranscriptStructuringEntityCandidate,
  TranscriptStructuringInput,
  TranscriptStructuringItem,
  TranscriptStructuringProvider,
  TranscriptStructuringProviderName,
  TranscriptStructuringResult,
  TranscriptStructuringSourceContext,
} from "@/server/providers/transcript-structuring/types";
export {
  parseTranscriptStructuringResult,
  TranscriptStructuringProviderConfigurationError,
  TranscriptStructuringProviderError,
} from "@/server/providers/transcript-structuring/types";

export const DEFAULT_TRANSCRIPT_STRUCTURING_PROVIDER: TranscriptStructuringProviderName =
  "openai";

type TranscriptStructuringProviderFactoryInput = {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
};

function isTranscriptStructuringProviderName(
  value: string,
): value is TranscriptStructuringProviderName {
  return transcriptStructuringProviderNames.includes(
    value as TranscriptStructuringProviderName,
  );
}

export function getTranscriptStructuringProvider(
  input: TranscriptStructuringProviderFactoryInput = {},
): TranscriptStructuringProvider {
  const env = getRuntimeEnv(input.env);
  const configuredName =
    env.TRANSCRIPT_STRUCTURING_PROVIDER ??
    DEFAULT_TRANSCRIPT_STRUCTURING_PROVIDER;

  if (!isTranscriptStructuringProviderName(configuredName)) {
    throw new TranscriptStructuringProviderConfigurationError(
      `Unsupported transcript structuring provider: ${configuredName}`,
    );
  }

  if (configuredName === "mock") {
    if (env.NODE_ENV === "production") {
      throw new TranscriptStructuringProviderConfigurationError(
        "Mock transcript structuring provider is not allowed in production",
      );
    }

    return new MockTranscriptStructuringProvider();
  }

  return new OpenAITranscriptStructuringProvider({
    apiKey: env.OPENAI_API_KEY,
    fetchImpl: input.fetchImpl,
    model: env.OPENAI_STRUCTURING_MODEL ?? DEFAULT_OPENAI_STRUCTURING_MODEL,
  });
}
