import { getRuntimeEnv } from "@/server/config/env";
import { DisabledMicrosoftGraphProvider } from "@/server/providers/microsoft-graph/disabled";
import { MockMicrosoftGraphProvider } from "@/server/providers/microsoft-graph/mock";
import {
  microsoftGraphProviderNames,
  MicrosoftGraphProviderConfigurationError,
  type MicrosoftGraphProvider,
  type MicrosoftGraphProviderName,
} from "@/server/providers/microsoft-graph/types";

export { DisabledMicrosoftGraphProvider } from "@/server/providers/microsoft-graph/disabled";
export { MockMicrosoftGraphProvider } from "@/server/providers/microsoft-graph/mock";
export type {
  MicrosoftGraphCalendarEventSummary,
  MicrosoftGraphCapabilityKey,
  MicrosoftGraphConnectionStatus,
  MicrosoftGraphConnectionStatusResult,
  MicrosoftGraphContactSummary,
  MicrosoftGraphMailMessageSummary,
  MicrosoftGraphMailThreadSummary,
  MicrosoftGraphProvider,
  MicrosoftGraphProviderContext,
  MicrosoftGraphProviderName,
} from "@/server/providers/microsoft-graph/types";
export {
  MicrosoftGraphProviderConfigurationError,
  MicrosoftGraphProviderError,
  MicrosoftGraphProviderUnavailableError,
} from "@/server/providers/microsoft-graph/types";

export const DEFAULT_MICROSOFT_GRAPH_PROVIDER: MicrosoftGraphProviderName =
  "disabled";

type MicrosoftGraphProviderFactoryInput = {
  env?: NodeJS.ProcessEnv;
};

function isMicrosoftGraphProviderName(
  value: string,
): value is MicrosoftGraphProviderName {
  return microsoftGraphProviderNames.includes(
    value as MicrosoftGraphProviderName,
  );
}

export function getMicrosoftGraphProvider(
  input: MicrosoftGraphProviderFactoryInput = {},
): MicrosoftGraphProvider {
  const env = getRuntimeEnv(input.env);
  const configuredName =
    env.MICROSOFT_GRAPH_PROVIDER ?? DEFAULT_MICROSOFT_GRAPH_PROVIDER;

  if (!isMicrosoftGraphProviderName(configuredName)) {
    throw new MicrosoftGraphProviderConfigurationError(
      `Unsupported Microsoft Graph provider: ${configuredName}`,
    );
  }

  if (configuredName === "mock") {
    if (env.NODE_ENV === "production") {
      throw new MicrosoftGraphProviderConfigurationError(
        "Mock Microsoft Graph provider is not allowed in production",
      );
    }

    return new MockMicrosoftGraphProvider();
  }

  return new DisabledMicrosoftGraphProvider();
}
