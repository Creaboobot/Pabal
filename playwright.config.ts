import { defineConfig, devices } from "@playwright/test";

const authFile = "tests/e2e/.auth/demo-user.json";
const isCi = Boolean(process.env.CI);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  "pnpm exec next dev --hostname 127.0.0.1 --port 3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: [["list"]],
  retries: isCi ? 1 : 0,
  ...(isCi ? { workers: 1 } : {}),
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: webServerCommand,
    env: {
      AUTH_SECRET: "playwright-local-smoke-test-secret",
      BILLING_PROVIDER: "disabled",
      ENABLE_DEV_AUTH: "true",
      MICROSOFT_GRAPH_PROVIDER: "disabled",
      NEXT_TELEMETRY_DISABLED: "1",
      SPEECH_TO_TEXT_PROVIDER: "mock",
      TRANSCRIPT_STRUCTURING_PROVIDER: "mock",
    },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "unauth-mobile-chromium",
      testMatch: /foundation\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "signed-in-mobile-chromium",
      dependencies: ["setup"],
      testMatch: /signed-in-smoke\.spec\.ts/,
      use: { ...devices["Pixel 7"], storageState: authFile },
    },
  ],
});
