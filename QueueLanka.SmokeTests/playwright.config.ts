import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 15_000,
  retries: 0,
  use: {
    baseURL: "https://queuelanka-api-fwhthqd4g9e0aee2.centralindia-01.azurewebsites.net",
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },
});
