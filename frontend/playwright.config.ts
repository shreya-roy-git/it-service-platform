import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for the IT Service Platform frontend.
 *
 * Targets: http://localhost:3000
 * Backend must be running at: http://localhost:4000
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  testIgnore: ["**/backend/**", "**/*.test.ts"],

  /** Run tests sequentially within a file to avoid auth race conditions */
  fullyParallel: false,

  /** Fail the build on CI if test.only is left in source code */
  forbidOnly: !!process.env.CI,

  /** No retries on flaky tests in local dev; 2 retries on CI */
  retries: process.env.CI ? 2 : 0,

  /** Limit workers to 1 to avoid parallel login conflicts */
  workers: process.env.CI ? 1 : 1,

  /** Reporter: list in terminal, HTML report saved to playwright-report/ */
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    /** Base URL for all page.goto('/...') calls */
    baseURL: "http://localhost:3000",

    /** Collect trace on first retry for debugging */
    trace: "on-first-retry",

    /** Screenshot on test failure */
    screenshot: "only-on-failure",

    /** Increase default timeout for slower CI machines */
    actionTimeout: 10_000,

    /** Headless by default; set PWDEBUG=1 to open headed */
    headless: true,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /**
   * Local dev server config.
   * Playwright will start `next dev` automatically if the dev server is not
   * already running. Set `USE_EXISTING_SERVER=1` to skip auto-start.
   */
  webServer: process.env.USE_EXISTING_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
