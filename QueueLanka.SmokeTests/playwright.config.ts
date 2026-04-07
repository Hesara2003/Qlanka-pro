import { defineConfig } from "@playwright/test";

const baseURL =
  process.env.SMOKE_BASE_URL ??
  "https://20.193.250.12:9443";

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
