import { describe, expect, it } from "vitest";

import {
  getMicrosoftEntraIssuer,
  hasMicrosoftEntraProviderConfig,
} from "@/server/services/auth-provider-config";

const testEnv = (values: Partial<NodeJS.ProcessEnv>): NodeJS.ProcessEnv => ({
  NODE_ENV: "test",
  ...values,
});

describe("auth provider configuration", () => {
  it("detects complete Microsoft Entra provider configuration", () => {
    expect(
      hasMicrosoftEntraProviderConfig(testEnv({
        AUTH_MICROSOFT_ENTRA_ID_ID: "client-id",
        AUTH_MICROSOFT_ENTRA_ID_SECRET: "client-secret",
        AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: "tenant-id",
      })),
    ).toBe(true);
  });

  it("does not report Microsoft Entra as available when credentials are incomplete", () => {
    expect(
      hasMicrosoftEntraProviderConfig(testEnv({
        AUTH_MICROSOFT_ENTRA_ID_ID: "client-id",
      })),
    ).toBe(false);
  });

  it("builds an issuer from tenant id without requiring credentials at build time", () => {
    expect(
      getMicrosoftEntraIssuer(testEnv({
        AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: "tenant-id",
      })),
    ).toBe("https://login.microsoftonline.com/tenant-id/v2.0");
  });
});
