// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  DisabledMicrosoftGraphProvider,
  getMicrosoftGraphProvider,
  MicrosoftGraphProviderConfigurationError,
  MicrosoftGraphProviderUnavailableError,
  MockMicrosoftGraphProvider,
} from "@/server/providers/microsoft-graph";

const providerContext = {
  tenantId: "tenant_test_1",
  userId: "user_test_1",
};

describe("Microsoft Graph providers", () => {
  it("defaults to the disabled provider", () => {
    const provider = getMicrosoftGraphProvider({
      env: {
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv,
    });

    expect(provider).toBeInstanceOf(DisabledMicrosoftGraphProvider);
  });

  it("reports a readiness-only disconnected state from the disabled provider", async () => {
    const provider = new DisabledMicrosoftGraphProvider();

    await expect(
      provider.getConnectionStatus(providerContext),
    ).resolves.toEqual({
      capabilities: {
        calendar: false,
        contacts: false,
        mail: false,
      },
      connected: false,
      message: "Readiness only. No Microsoft data is synced yet.",
      provider: "disabled",
      status: "DISCONNECTED",
    });
  });

  it("prevents data retrieval when Graph is disabled", async () => {
    const provider = new DisabledMicrosoftGraphProvider();

    await expect(
      provider.getCalendarEvents({
        context: providerContext,
        from: new Date("2026-04-26T00:00:00.000Z"),
        to: new Date("2026-04-27T00:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(MicrosoftGraphProviderUnavailableError);
  });

  it("selects the mock provider only when explicitly configured outside production", () => {
    const provider = getMicrosoftGraphProvider({
      env: {
        MICROSOFT_GRAPH_PROVIDER: "mock",
        NODE_ENV: "test",
      } as NodeJS.ProcessEnv,
    });

    expect(provider).toBeInstanceOf(MockMicrosoftGraphProvider);
  });

  it("rejects the mock provider in production", () => {
    expect(() =>
      getMicrosoftGraphProvider({
        env: {
          MICROSOFT_GRAPH_PROVIDER: "mock",
          NODE_ENV: "production",
        } as NodeJS.ProcessEnv,
      }),
    ).toThrow(MicrosoftGraphProviderConfigurationError);
  });

  it("rejects unsupported Microsoft Graph providers", () => {
    expect(() =>
      getMicrosoftGraphProvider({
        env: {
          MICROSOFT_GRAPH_PROVIDER: "live",
          NODE_ENV: "test",
        } as NodeJS.ProcessEnv,
      }),
    ).toThrow(MicrosoftGraphProviderConfigurationError);
  });

  it("returns normalized mock DTOs without raw Graph response shapes", async () => {
    const provider = new MockMicrosoftGraphProvider();

    const [event] = await provider.getCalendarEvents({
      context: providerContext,
      from: new Date("2026-04-26T00:00:00.000Z"),
      to: new Date("2026-04-27T00:00:00.000Z"),
    });
    const [thread] = await provider.getMailThreads({
      context: providerContext,
      limit: 1,
    });
    const [contact] = await provider.getContacts({
      context: providerContext,
      limit: 1,
    });

    expect(event).toMatchObject({
      externalId: "mock-calendar-event-1",
      subject: "Mock readiness meeting",
    });
    expect(thread).toMatchObject({
      externalId: "mock-mail-thread-1",
      subject: "Mock selected email context",
    });
    expect(contact).toMatchObject({
      displayName: "Anna Keller",
      externalId: "mock-contact-1",
    });
    expect(Object.keys(event ?? {})).not.toContain("@odata.context");
    expect(Object.keys(thread ?? {})).not.toContain("@odata.context");
    expect(Object.keys(contact ?? {})).not.toContain("@odata.context");
  });
});
