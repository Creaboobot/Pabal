import { getRuntimeEnv } from "@/server/config/env";
import { DisabledBillingProvider } from "@/server/providers/billing/disabled";
import { MockBillingProvider } from "@/server/providers/billing/mock";
import {
  billingProviderNames,
  BillingProviderConfigurationError,
  type BillingProvider,
  type BillingProviderName,
} from "@/server/providers/billing/types";

export { DisabledBillingProvider } from "@/server/providers/billing/disabled";
export { MockBillingProvider } from "@/server/providers/billing/mock";
export type {
  BillingCapabilityKey,
  BillingCustomerSummary,
  BillingProvider,
  BillingProviderContext,
  BillingProviderName,
  BillingProviderStatusSummary,
  BillingReadinessSummary,
  BillingStatus,
  BillingSubscriptionSummary,
  BillingUnavailableActionResult,
} from "@/server/providers/billing/types";
export {
  BillingProviderConfigurationError,
  BillingProviderError,
} from "@/server/providers/billing/types";

export const DEFAULT_BILLING_PROVIDER: BillingProviderName = "disabled";

type BillingProviderFactoryInput = {
  env?: NodeJS.ProcessEnv;
};

function isBillingProviderName(value: string): value is BillingProviderName {
  return billingProviderNames.includes(value as BillingProviderName);
}

export function getBillingProvider(
  input: BillingProviderFactoryInput = {},
): BillingProvider {
  const env = getRuntimeEnv(input.env);
  const configuredName = env.BILLING_PROVIDER ?? DEFAULT_BILLING_PROVIDER;

  if (!isBillingProviderName(configuredName)) {
    throw new BillingProviderConfigurationError(
      `Unsupported billing provider: ${configuredName}`,
    );
  }

  if (configuredName === "mock") {
    if (env.NODE_ENV === "production") {
      throw new BillingProviderConfigurationError(
        "Mock billing provider is not allowed in production",
      );
    }

    return new MockBillingProvider();
  }

  return new DisabledBillingProvider();
}
