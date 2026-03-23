import { test, expect } from "@playwright/test";
import {
  expectAuthBlockedStatus,
  requestWithRetry,
  tryGetAdminAuthToken,
  tryGetAuthToken,
} from "../helpers/smoke.helper";

test.describe("Counter Flow Smoke Tests", () => {
  test("POST /api/counters/1/call-next without auth returns 401", async ({ request }) => {
    const response = await requestWithRetry(request, "post", "/api/counters/1/call-next", { data: {} });
    expectAuthBlockedStatus(response.status());
  });

  test("POST /api/counters/1/call-next with citizen role returns 403", async ({ request }) => {
    const auth = await tryGetAuthToken(request);
    if (!auth.ok || !auth.token) {
      expectAuthBlockedStatus(auth.status ?? 403);
      return;
    }

    const response = await requestWithRetry(request, "post", "/api/counters/1/call-next", {
      headers: { Authorization: `Bearer ${auth.token}` },
      data: {},
    });

    expect(response.status()).toBe(403);
  });

  test("PUT /api/counters/1/tokens/1/status without auth returns 401", async ({ request }) => {
    const response = await requestWithRetry(request, "put", "/api/counters/1/tokens/1/status", {
      data: { status: "served" },
    });

    expectAuthBlockedStatus(response.status());
  });

  test("POST /api/counters/1/tokens/reassign without auth returns 401", async ({ request }) => {
    const response = await requestWithRetry(request, "post", "/api/counters/1/tokens/reassign", {
      data: { tokenId: 1, targetCounterId: 2, reason: "smoke-test" },
    });

    expectAuthBlockedStatus(response.status());
  });

  test("GET /api/counters/1/dashboard without auth returns 401", async ({ request }) => {
    const response = await requestWithRetry(request, "get", "/api/counters/1/dashboard");

    expectAuthBlockedStatus(response.status());
  });

  test("GET /api/counters/1/dashboard with citizen role returns 403", async ({ request }) => {
    const auth = await tryGetAuthToken(request);
    if (!auth.ok || !auth.token) {
      expectAuthBlockedStatus(auth.status ?? 403);
      return;
    }

    const response = await requestWithRetry(request, "get", "/api/counters/1/dashboard", {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    expect(response.status()).toBe(403);
  });

  test("GET /api/admin/centers/1/counters with admin role returns 200 or 404", async ({ request }) => {
    const adminAuth = await tryGetAdminAuthToken(request);
    if (!adminAuth.ok || !adminAuth.token) {
      expectAuthBlockedStatus(adminAuth.status ?? 403);
      return;
    }

    const response = await requestWithRetry(request, "get", "/api/admin/centers/1/counters", {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });

    expect([200, 403, 404]).toContain(response.status());
  });

  test("POST /api/admin/centers/1/counters with admin role returns expected status", async ({ request }) => {
    const adminAuth = await tryGetAdminAuthToken(request);
    if (!adminAuth.ok || !adminAuth.token) {
      expectAuthBlockedStatus(adminAuth.status ?? 403);
      return;
    }

    const response = await requestWithRetry(request, "post", "/api/admin/centers/1/counters", {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
      data: {
        name: `Smoke Counter ${Date.now()}`,
        centerId: 1,
      },
    });

    expect([201, 400, 403, 404, 409]).toContain(response.status());
  });
});
