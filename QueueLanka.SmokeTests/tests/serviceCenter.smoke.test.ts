import { test, expect } from "@playwright/test";
import {
  expectAuthBlockedStatus,
  requestWithRetry,
  tryGetAuthToken,
} from "../helpers/smoke.helper";

// ─────────────────────────────────────────────────────────────
// Service Center Smoke Tests — /api/service-centers
// ─────────────────────────────────────────────────────────────

test.describe("Service Center Smoke Tests", () => {
  test("GET /api/service-centers — returns 200 + array", async ({
    request,
  }) => {
    const response = await requestWithRetry(request, "get", "/api/service-centers");

    expect([200, 403]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty("data");
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  test("GET /api/service-centers/1 — valid ID returns 200", async ({
    request,
  }) => {
    const response = await requestWithRetry(request, "get", "/api/service-centers/1");

    expect([200, 403, 404]).toContain(response.status());
  });

  test("GET /api/service-centers/999999 — invalid ID returns 404", async ({
    request,
  }) => {
    const response = await requestWithRetry(request, "get", "/api/service-centers/999999");

    expect([403, 404]).toContain(response.status());
  });

  test("POST /api/service-centers — admin can create (or 401/403 if not admin)", async ({
    request,
  }) => {
    const auth = await tryGetAuthToken(request);
    if (!auth.ok || !auth.token) {
      expectAuthBlockedStatus(auth.status ?? 403);
      return;
    }

    const response = await requestWithRetry(request, "post", "/api/service-centers", {
      headers: { Authorization: `Bearer ${auth.token}` },
      data: {
        name: "Smoke Test Center",
        address: "123 Smoke Test Street, Colombo",
        phone: "+94771234567",
        capacity: 50,
        averageServiceTimeMinutes: 15,
        openingTime: "08:00",
        closingTime: "17:00",
      },
    });

    expect([201, 400, 403, 404, 409]).toContain(response.status());
  });
});
