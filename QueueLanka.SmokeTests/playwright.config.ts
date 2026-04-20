import { defineConfig } from "@playwright/test";

const baseURL =
  process.env.SMOKE_BASE_URL ??
  "https://20.193.250.12:9443";

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
