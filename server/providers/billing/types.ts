export const billingProviderNames = ["disabled", "mock"] as const;

export type BillingProviderName = (typeof billingProviderNames)[number];

export type BillingStatus =
  | "DISABLED"
  | "INTERNAL"
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED";

export type BillingProviderContext = {
  tenantId: string;
  userId: string;
};

export type BillingCapabilityKey = "checkout" | "portal" | "webhooks";

export type BillingProviderStatusSummary = {
  capabilities: Record<BillingCapabilityKey, boolean>;
  configured: boolean;
  liveMode: boolean;
  message: string;
  provider: BillingProviderName;
  status: BillingStatus;
};

export type BillingCustomerSummary = {
  displayName?: string | null;
  externalCustomerId?: string | null;
};

export type BillingSubscriptionSummary = {
  currentPeriodEnd?: Date | null;
  externalSubscriptionId?: string | null;
  planName?: string | null;
  status: BillingStatus;
};

export type BillingUnavailableActionResult = {
  available: false;
  message: string;
  provider: BillingProviderName;
};

export type BillingReadinessSummary = {
  checkout: BillingUnavailableActionResult;
  customer: BillingCustomerSummary | null;
  portal: BillingUnavailableActionResult;
  providerStatus: BillingProviderStatusSummary;
  status: BillingStatus;
  subscription: BillingSubscriptionSummary | null;
};

export class BillingProviderError extends Error {
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
    this.name = "BillingProviderError";
    this.code = input.code;
    this.safeMessage = input.safeMessage;
    this.statusCode = input.statusCode;
  }
}

export class BillingProviderConfigurationError extends BillingProviderError {
  constructor(message: string) {
    super({
      code: "provider_configuration_error",
      message,
      safeMessage: "Billing is not configured.",
      statusCode: 503,
    });
    this.name = "BillingProviderConfigurationError";
  }
}

export type BillingProvider = {
  getBillingStatus(
    context: BillingProviderContext,
  ): Promise<BillingReadinessSummary>;
  getCheckoutAvailability(
    context: BillingProviderContext,
  ): Promise<BillingUnavailableActionResult>;
  getPortalAvailability(
    context: BillingProviderContext,
  ): Promise<BillingUnavailableActionResult>;
  name: BillingProviderName;
};
