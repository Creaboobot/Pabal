import {
  type BillingProvider,
  type BillingProviderContext,
  type BillingReadinessSummary,
  type BillingUnavailableActionResult,
} from "@/server/providers/billing/types";

type MockBillingProviderInput = {
  summary?: BillingReadinessSummary;
};

const mockUnavailableAction = {
  available: false,
  message: "Mock billing provider is readiness-only; no session is created.",
  provider: "mock",
} as const;

const defaultMockSummary = {
  checkout: mockUnavailableAction,
  customer: {
    displayName: "Mock workspace customer",
    externalCustomerId: "mock_customer_1",
  },
  portal: mockUnavailableAction,
  providerStatus: {
    capabilities: {
      checkout: false,
      portal: false,
      webhooks: false,
    },
    configured: true,
    liveMode: false,
    message:
      "Mock billing readiness is available for local and test verification only.",
    provider: "mock",
    status: "INTERNAL",
  },
  status: "INTERNAL",
  subscription: {
    currentPeriodEnd: null,
    externalSubscriptionId: "mock_subscription_1",
    planName: "Internal readiness",
    status: "INTERNAL",
  },
} satisfies BillingReadinessSummary;

export class MockBillingProvider implements BillingProvider {
  readonly name = "mock";
  private readonly summary: BillingReadinessSummary;

  constructor(input: MockBillingProviderInput = {}) {
    this.summary = input.summary ?? defaultMockSummary;
  }

  async getBillingStatus(
    _context: BillingProviderContext,
  ): Promise<BillingReadinessSummary> {
    return this.summary;
  }

  async getCheckoutAvailability(
    _context: BillingProviderContext,
  ): Promise<BillingUnavailableActionResult> {
    return this.summary.checkout;
  }

  async getPortalAvailability(
    _context: BillingProviderContext,
  ): Promise<BillingUnavailableActionResult> {
    return this.summary.portal;
  }
}
