import { defineConfig } from "@playwright/test";

const baseURL =
  process.env.SMOKE_BASE_URL ??
  "https://queuelanka-api-fwhthqd4g9e0aee2.centralindia-01.azurewebsites.net";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : "list",
  globalSetup: "./global-setup.ts",
  use: {
    baseURL,
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
});
