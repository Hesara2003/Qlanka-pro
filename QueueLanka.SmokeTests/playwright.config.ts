import { defineConfig } from "@playwright/test";

const baseURL =
  process.env.SMOKE_BASE_URL ??
  "https://queuelanka-api-fwhthqd4g9e0aee2.centralindia-01.azurewebsites.net";

export default defineConfig({
  testDir: "./tests",
  timeout: 15_000,
  retries: 0,
  workers: 1,
  globalSetup: "./global-setup.ts",
  use: {
    baseURL,
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },
});
