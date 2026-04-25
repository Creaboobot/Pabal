import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAppShellSummary: vi.fn(),
  getCurrentUserContext: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  usePathname: () => "/today",
}));

vi.mock("@/auth", () => ({
  signOut: mocks.signOut,
}));

vi.mock("@/server/services/session", () => ({
  getCurrentUserContext: mocks.getCurrentUserContext,
}));

vi.mock("@/server/services/app-shell-summary", () => ({
  getAppShellSummary: mocks.getAppShellSummary,
}));

const tenantContext = {
  userId: "user_test_1",
  tenantId: "tenant_test_1",
  tenantName: "Demo Workspace",
  roleKey: "OWNER",
};

const appSummary = {
  action: {
    openTasks: 1,
    openCommitments: 1,
    pendingProposals: 1,
    upcomingMeetings: 1,
  },
  capture: {
    notes: 2,
    pendingProposals: 1,
    voiceNotes: 1,
  },
  people: {
    companies: 2,
    people: 4,
  },
  opportunities: {
    capabilities: 1,
    introductionSuggestions: 1,
    needs: 1,
  },
};

type AsyncPage = () => Promise<ReactElement>;

const routes: Array<[string, () => Promise<{ default: AsyncPage }>]> = [
  ["Today", () => import("@/app/(app)/today/page")],
  ["Capture", () => import("@/app/(app)/capture/page")],
  ["People", () => import("@/app/(app)/people/page")],
  ["Opportunities", () => import("@/app/(app)/opportunities/page")],
  ["Search", () => import("@/app/(app)/search/page")],
];

async function renderRoute(importPage: () => Promise<{ default: AsyncPage }>) {
  const Page = (await importPage()).default;

  render(await Page());
}

describe("protected app routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUserContext.mockResolvedValue(tenantContext);
    mocks.getAppShellSummary.mockResolvedValue(appSummary);
  });

  it.each(routes)("renders the %s route", async (heading, importPage) => {
    await renderRoute(importPage);

    expect(
      screen.getByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
  });

  it("redirects the protected app shell when no session context exists", async () => {
    mocks.getCurrentUserContext.mockResolvedValueOnce(null);
    const Layout = (await import("@/app/(app)/layout")).default;

    await expect(
      Layout({ children: <div>Protected content</div> }),
    ).rejects.toThrow("redirect:/sign-in");
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
  });
});
