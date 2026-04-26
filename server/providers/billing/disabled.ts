import {
  type BillingProvider,
  type BillingProviderContext,
  type BillingReadinessSummary,
  type BillingUnavailableActionResult,
} from "@/server/providers/billing/types";

const disabledAction = {
  available: false,
  message: "Billing is readiness-only. This action is coming later.",
  provider: "disabled",
} as const;

export class DisabledBillingProvider implements BillingProvider {
  readonly name = "disabled";

  async getBillingStatus(
    _context: BillingProviderContext,
  ): Promise<BillingReadinessSummary> {
    return {
      checkout: disabledAction,
      customer: null,
      portal: disabledAction,
      providerStatus: {
        capabilities: {
          checkout: false,
          portal: false,
          webhooks: false,
        },
        configured: false,
        liveMode: false,
        message:
          "Billing readiness only. No checkout, portal, webhooks, or payment collection are live.",
        provider: this.name,
        status: "DISABLED",
      },
      status: "DISABLED",
      subscription: null,
    };
  }

  async getCheckoutAvailability(
    _context: BillingProviderContext,
  ): Promise<BillingUnavailableActionResult> {
    return disabledAction;
  }

  async getPortalAvailability(
    _context: BillingProviderContext,
  ): Promise<BillingUnavailableActionResult> {
    return disabledAction;
  }
}
