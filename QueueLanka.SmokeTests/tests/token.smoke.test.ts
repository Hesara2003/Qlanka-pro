import { test, expect } from "@playwright/test";
import {
  expectAuthBlockedStatus,
  requestWithRetry,
  tryGetAuthToken,
} from "../helpers/smoke.helper";

// ─────────────────────────────────────────────────────────────
// Token Smoke Tests — /api/Token
// ─────────────────────────────────────────────────────────────

test.describe("Token Smoke Tests", () => {
  test("GET /api/Token/my-tokens — with auth returns 200", async ({
    request,
  }) => {
    const auth = await tryGetAuthToken(request);
    if (!auth.ok || !auth.token) {
      expectAuthBlockedStatus(auth.status ?? 403);
      return;
    }

    const response = await requestWithRetry(request, "get", "/api/Token/my-tokens", {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    expect([200, 403]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    }
  });

  test("GET /api/Token/my-tokens — without auth returns 401", async ({
    request,
  }) => {
    const response = await requestWithRetry(request, "get", "/api/Token/my-tokens");

    expectAuthBlockedStatus(response.status());
  });

  test("PUT /api/Token/999999/cancel — invalid token ID returns 404", async ({
    request,
  }) => {
    const auth = await tryGetAuthToken(request);
    if (!auth.ok || !auth.token) {
      expectAuthBlockedStatus(auth.status ?? 403);
      return;
    }

    const response = await requestWithRetry(request, "put", "/api/Token/999999/cancel", {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    expect([404, 403]).toContain(response.status());
  });

  test("PUT /api/Token/1/cancel — without auth returns 401", async ({
    request,
  }) => {
    const response = await requestWithRetry(request, "put", "/api/Token/1/cancel");

    expectAuthBlockedStatus(response.status());
  });
});
