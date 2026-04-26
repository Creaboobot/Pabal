import { expect, test as setup } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const authFile = "tests/e2e/.auth/demo-user.json";

setup("authenticate as seeded demo reviewer", async ({ page }) => {
  await page.goto("/sign-in?callbackUrl=/today");

  await expect(
    page.getByRole("heading", { name: "Sign in to Pobal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Development sign-in" }),
  ).toBeVisible();

  await page.getByLabel("Email").fill("demo@pobal.local");
  await page.getByLabel("Name").fill("Demo Reviewer");
  await page
    .getByRole("button", { name: "Continue with development access" })
    .click();

  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

  await mkdir(dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
