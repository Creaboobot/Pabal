import { getRuntimeEnv, type RuntimeEnv } from "@/server/config/env";
import { DEFAULT_SPEECH_TO_TEXT_PROVIDER } from "@/server/providers/speech-to-text";
import { speechToTextProviderNames } from "@/server/providers/speech-to-text/types";
import { DEFAULT_TRANSCRIPT_STRUCTURING_PROVIDER } from "@/server/providers/transcript-structuring";
import { transcriptStructuringProviderNames } from "@/server/providers/transcript-structuring/types";

export type VoiceProviderReadinessStatus =
  | "available"
  | "demo"
  | "misconfigured"
  | "requires_configuration";

export type VoiceProviderReadiness = {
  available: boolean;
  badgeLabel: string;
  detail: string;
  isDemo: boolean;
  providerLabel: string;
  status: VoiceProviderReadinessStatus;
  summary: string;
  title: string;
  unavailableMessage: string;
};

type ReadinessInput = {
  configuredName: string | undefined;
  defaultName: string;
  kind: "speech-to-text" | "transcript-structuring";
  nodeEnv: RuntimeEnv["NODE_ENV"];
  openAIKey: string | undefined;
  providerNames: readonly string[];
};

function providerLabel(providerName: string | null) {
  switch (providerName) {
    case "openai":
      return "OpenAI";
    case "mock":
      return "Mock";
    default:
      return "Unsupported provider";
  }
}

function titleForKind(kind: ReadinessInput["kind"]) {
  return kind === "speech-to-text"
    ? "Speech-to-text provider"
    : "Transcript structuring provider";
}

function unavailableMessageForKind(kind: ReadinessInput["kind"]) {
  return kind === "speech-to-text"
    ? "Transcription requires a configured provider before this recording can be uploaded."
    : "Suggested update creation requires a configured transcript-structuring provider.";
}

function readyText(kind: ReadinessInput["kind"]) {
  if (kind === "speech-to-text") {
    return {
      badgeLabel: "Transcription ready",
      detail:
        "Uploaded audio can be transcribed through the configured speech-to-text provider.",
      summary: "Speech-to-text provider is configured.",
    };
  }

  return {
    badgeLabel: "Structuring ready",
    detail:
      "Reviewed transcripts can be structured into review-only Suggested updates.",
    summary: "Transcript structuring provider is configured.",
  };
}

function demoText(kind: ReadinessInput["kind"]) {
  if (kind === "speech-to-text") {
    return {
      badgeLabel: "Demo transcription mode",
      detail:
        "Mock provider active - local/test only. This is not real transcription.",
      summary: "Demo transcription mode is active.",
    };
  }

  return {
    badgeLabel: "Demo structuring mode",
    detail:
      "Mock provider active - local/test only. This is not real transcript structuring.",
    summary: "Demo transcript structuring mode is active.",
  };
}

function requiredConfigurationText(kind: ReadinessInput["kind"]) {
  if (kind === "speech-to-text") {
    return {
      badgeLabel: "Configuration required",
      detail:
        "Recording can start, but transcription needs provider configuration before upload.",
      summary: "Speech-to-text provider needs configuration.",
    };
  }

  return {
    badgeLabel: "Configuration required",
    detail:
      "Transcript review is available, but Suggested update creation needs provider configuration.",
    summary: "Transcript structuring provider needs configuration.",
  };
}

function misconfiguredText(kind: ReadinessInput["kind"]) {
  if (kind === "speech-to-text") {
    return {
      badgeLabel: "Misconfigured",
      detail:
        "Recording can start, but transcription is unavailable until provider configuration is fixed.",
      summary: "Speech-to-text provider is misconfigured.",
    };
  }

  return {
    badgeLabel: "Misconfigured",
    detail:
      "Transcript review is available, but Suggested update creation is unavailable until provider configuration is fixed.",
    summary: "Transcript structuring provider is misconfigured.",
  };
}

function buildProviderReadiness(input: ReadinessInput): VoiceProviderReadiness {
  const configuredName = input.configuredName ?? input.defaultName;
  const title = titleForKind(input.kind);
  const unavailableMessage = unavailableMessageForKind(input.kind);

  if (!input.providerNames.includes(configuredName)) {
    const text = misconfiguredText(input.kind);

    return {
      available: false,
      isDemo: false,
      providerLabel: providerLabel(null),
      status: "misconfigured",
      title,
      unavailableMessage,
      ...text,
    };
  }

  if (configuredName === "mock") {
    if (input.nodeEnv === "production") {
      const text = misconfiguredText(input.kind);

      return {
        available: false,
        isDemo: false,
        providerLabel: providerLabel(configuredName),
        status: "misconfigured",
        title,
        unavailableMessage,
        ...text,
      };
    }

    const text = demoText(input.kind);

    return {
      available: true,
      isDemo: true,
      providerLabel: providerLabel(configuredName),
      status: "demo",
      title,
      unavailableMessage,
      ...text,
    };
  }

  if (!input.openAIKey) {
    const text = requiredConfigurationText(input.kind);

    return {
      available: false,
      isDemo: false,
      providerLabel: providerLabel(configuredName),
      status: "requires_configuration",
      title,
      unavailableMessage,
      ...text,
    };
  }

  const text = readyText(input.kind);

  return {
    available: true,
    isDemo: false,
    providerLabel: providerLabel(configuredName),
    status: "available",
    title,
    unavailableMessage,
    ...text,
  };
}

export function getSpeechToTextProviderReadiness(
  env: RuntimeEnv = getRuntimeEnv(),
) {
  return buildProviderReadiness({
    configuredName: env.SPEECH_TO_TEXT_PROVIDER,
    defaultName: DEFAULT_SPEECH_TO_TEXT_PROVIDER,
    kind: "speech-to-text",
    nodeEnv: env.NODE_ENV,
    openAIKey: env.OPENAI_API_KEY,
    providerNames: speechToTextProviderNames,
  });
}

export function getTranscriptStructuringProviderReadiness(
  env: RuntimeEnv = getRuntimeEnv(),
) {
  return buildProviderReadiness({
    configuredName: env.TRANSCRIPT_STRUCTURING_PROVIDER,
    defaultName: DEFAULT_TRANSCRIPT_STRUCTURING_PROVIDER,
    kind: "transcript-structuring",
    nodeEnv: env.NODE_ENV,
    openAIKey: env.OPENAI_API_KEY,
    providerNames: transcriptStructuringProviderNames,
  });
}

export function getVoiceProviderReadiness(env: RuntimeEnv = getRuntimeEnv()) {
  return {
    speechToText: getSpeechToTextProviderReadiness(env),
    transcriptStructuring: getTranscriptStructuringProviderReadiness(env),
  };
}
