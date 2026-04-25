import { expect, test } from "@playwright/test";

test("loads the foundation shell on mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pobal" })).toBeVisible();
  await expect(page.getByText("Foundation", { exact: true })).toBeVisible();
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
