import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  devAuthEnabled: false,
  microsoftConfigured: false,
  signIn: vi.fn(),
}));

vi.mock("@/auth", () => ({
  signIn: mocks.signIn,
}));

vi.mock("@/server/services/development-auth", () => ({
  isDevelopmentAuthEnabled: () => mocks.devAuthEnabled,
}));

vi.mock("@/server/services/auth-provider-config", () => ({
  hasMicrosoftEntraProviderConfig: () => mocks.microsoftConfigured,
  MICROSOFT_ENTRA_PROVIDER_ID: "microsoft-entra-id",
}));

describe("sign-in page states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.devAuthEnabled = false;
    mocks.microsoftConfigured = false;
  });

  it("shows development sign-in when local dev auth is enabled", async () => {
    mocks.devAuthEnabled = true;
    const Page = (await import("@/app/(auth)/sign-in/page")).default;

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Development sign-in")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Continue with development access",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/disabled automatically in production/i),
    ).toBeInTheDocument();
  });

  it("shows Microsoft Entra sign-in only when the provider is configured", async () => {
    mocks.microsoftConfigured = true;
    const Page = (await import("@/app/(auth)/sign-in/page")).default;

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Microsoft Entra sign-in")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Continue with Microsoft Entra",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Microsoft Entra-ready when provider credentials/i),
    ).not.toBeInTheDocument();
  });

  it("shows review setup guidance when no provider is configured", async () => {
    const Page = (await import("@/app/(auth)/sign-in/page")).default;

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByText("No sign-in provider is configured"),
    ).toBeInTheDocument();
    expect(screen.getByText(/For local review/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Microsoft Entra-ready when provider credentials/i),
    ).not.toBeInTheDocument();
  });
});
