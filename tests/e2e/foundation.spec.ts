import { expect, test } from "@playwright/test";

test("redirects unauthenticated visitors to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(
    page.getByRole("heading", { name: "Sign in to Pobal" }),
  ).toBeVisible();
});

test("protects the mobile app shell routes", async ({ page }) => {
  await page.goto("/today");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page).toHaveURL(/callbackUrl=%2Ftoday/);
});

test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = await response.json();

  expect(response.ok()).toBe(true);
  expect(body).toEqual({
    status: "ok",
    service: "pobal",
  });
});
