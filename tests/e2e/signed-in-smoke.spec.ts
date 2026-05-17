import { expect, type Page, test } from "@playwright/test";

type SmokeRoute = {
  path: string;
  heading?: string | RegExp;
};

const reviewCriticalRoutes: SmokeRoute[] = [
  { path: "/today", heading: "Today" },
  { path: "/capture", heading: "Capture" },
  { path: "/search?q=Anna", heading: "Search" },
  { path: "/people", heading: "People" },
  { path: "/people/companies", heading: "Companies" },
  { path: "/meetings", heading: "Meetings" },
  { path: "/notes", heading: "Notes" },
  { path: "/voice-notes", heading: "Voice notes" },
  { path: "/tasks", heading: "Tasks" },
  { path: "/commitments", heading: "Commitments" },
  { path: "/opportunities", heading: "Opportunities" },
  { path: "/proposals", heading: "Suggested updates" },
  { path: "/settings", heading: "Settings" },
  { path: "/settings/workspace", heading: "Workspace" },
  { path: "/settings/members", heading: "Members" },
  { path: "/settings/features", heading: "Features" },
  { path: "/settings/integrations", heading: "Integrations" },
  { path: "/settings/billing", heading: /Billing/i },
  { path: "/settings/governance", heading: "Governance" },
  { path: "/settings/privacy", heading: "Privacy" },
  { path: "/settings/archive", heading: "Archive" },
];

const deterministicDeepRoutes: SmokeRoute[] = [
  { path: "/people/demo-person-anna", heading: "Anna" },
  {
    path: "/people/companies/demo-company-nordic-industrials",
    heading: "Nordic Industrials",
  },
  {
    path: "/meetings/demo-meeting-grid-modernization/prep",
    heading: /Prep|brief|Grid/i,
  },
  {
    path: "/proposals/demo-ai-proposal-plm-teams-copilot",
    heading: /PLM|Copilot/i,
  },
];

async function expectSmokeRoute(page: Page, route: SmokeRoute) {
  const response = await page.goto(route.path);

  expect(response?.status(), `${route.path} HTTP status`).toBeLessThan(400);
  await expect(page).not.toHaveURL(/\/sign-in/);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();

  const heading = page.getByRole("heading", { level: 1 }).first();
  await expect(heading).toBeVisible();
  if (route.heading) {
    await expect(heading).toContainText(route.heading);
  }

  await expect(page.locator("body")).not.toContainText(
    "This page could not be found",
  );
  await expect(page.locator("body")).not.toContainText("Application error");
}

test.describe("signed-in mobile V1 smoke", () => {
  for (const route of reviewCriticalRoutes) {
    test(`loads ${route.path}`, async ({ page }) => {
      await expectSmokeRoute(page, route);
    });
  }

  for (const route of deterministicDeepRoutes) {
    test(`loads seeded deep route ${route.path}`, async ({ page }) => {
      await expectSmokeRoute(page, route);
    });
  }
});
