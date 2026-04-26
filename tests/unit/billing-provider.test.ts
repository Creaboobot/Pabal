// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  BillingProviderConfigurationError,
  DisabledBillingProvider,
  getBillingProvider,
  MockBillingProvider,
} from "@/server/providers/billing";

const providerContext = {
  tenantId: "tenant_test_1",
  userId: "user_test_1",
};

describe("billing providers", () => {
  it("defaults to the disabled provider", () => {
    const provider = getBillingProvider({
      env: {
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv,
    });

    expect(provider).toBeInstanceOf(DisabledBillingProvider);
  });

  it("returns normalized readiness-only DTOs from the disabled provider", async () => {
    const provider = new DisabledBillingProvider();

    await expect(provider.getBillingStatus(providerContext)).resolves.toEqual({
      checkout: {
        available: false,
        message: "Billing is readiness-only. This action is coming later.",
        provider: "disabled",
      },
      customer: null,
      portal: {
        available: false,
        message: "Billing is readiness-only. This action is coming later.",
        provider: "disabled",
      },
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
        provider: "disabled",
        status: "DISABLED",
      },
      status: "DISABLED",
      subscription: null,
    });
  });

  it("reports checkout and portal unavailable instead of creating sessions", async () => {
    const provider = new DisabledBillingProvider();

    await expect(
      provider.getCheckoutAvailability(providerContext),
    ).resolves.toMatchObject({
      available: false,
      provider: "disabled",
    });
    await expect(
      provider.getPortalAvailability(providerContext),
    ).resolves.toMatchObject({
      available: false,
      provider: "disabled",
    });
  });

  it("selects the mock provider only when explicitly configured outside production", () => {
    const provider = getBillingProvider({
      env: {
        BILLING_PROVIDER: "mock",
        NODE_ENV: "test",
      } as NodeJS.ProcessEnv,
    });

    expect(provider).toBeInstanceOf(MockBillingProvider);
  });

  it("rejects the mock provider in production", () => {
    expect(() =>
      getBillingProvider({
        env: {
          BILLING_PROVIDER: "mock",
          NODE_ENV: "production",
        } as NodeJS.ProcessEnv,
      }),
    ).toThrow(BillingProviderConfigurationError);
  });

  it("rejects unsupported billing providers, including stripe for 13B", () => {
    expect(() =>
      getBillingProvider({
        env: {
          BILLING_PROVIDER: "stripe",
          NODE_ENV: "test",
        } as NodeJS.ProcessEnv,
      }),
    ).toThrow(BillingProviderConfigurationError);
  });

  it("returns normalized mock DTOs without raw Stripe response shapes", async () => {
    const provider = new MockBillingProvider();
    const summary = await provider.getBillingStatus(providerContext);

    expect(summary).toMatchObject({
      customer: {
        externalCustomerId: "mock_customer_1",
      },
      providerStatus: {
        provider: "mock",
        status: "INTERNAL",
      },
      subscription: {
        externalSubscriptionId: "mock_subscription_1",
        planName: "Internal readiness",
      },
    });
    expect(Object.keys(summary.providerStatus)).not.toContain("livemode");
    expect(Object.keys(summary.customer ?? {})).not.toContain("object");
    expect(Object.keys(summary.subscription ?? {})).not.toContain("object");
  });
});
