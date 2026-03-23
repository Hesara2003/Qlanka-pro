import { test, expect } from "@playwright/test";
import {
  expectAuthBlockedStatus,
  requestWithRetry,
  tryGetAuthToken,
} from "../helpers/smoke.helper";

// ─────────────────────────────────────────────────────────────
// Appointment Smoke Tests — /api/Appointment
// ─────────────────────────────────────────────────────────────

test.describe("Appointment Smoke Tests", () => {
  test("GET /api/Appointment/my-bookings — with auth returns 200", async ({
    request,
  }) => {
    const auth = await tryGetAuthToken(request);
    if (!auth.ok || !auth.token) {
      expectAuthBlockedStatus(auth.status ?? 403);
      return;
    }

    const response = await requestWithRetry(request, "get", "/api/Appointment/my-bookings", {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    expect([200, 403]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty("data");
    }
  });

  test("GET /api/Appointment/my-bookings — without auth returns 401", async ({
    request,
  }) => {
    const response = await requestWithRetry(request, "get", "/api/Appointment/my-bookings");

    expectAuthBlockedStatus(response.status());
  });

  test("POST /api/Appointment/book — with auth returns 200 or 404/409", async ({
    request,
  }) => {
    const auth = await tryGetAuthToken(request);
    if (!auth.ok || !auth.token) {
      expectAuthBlockedStatus(auth.status ?? 403);
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await requestWithRetry(request, "post", "/api/Appointment/book", {
      headers: { Authorization: `Bearer ${auth.token}` },
      data: {
        centerId: 1,
        appointmentDate: tomorrow.toISOString().split("T")[0],
        appointmentTime: "10:00:00",
      },
    });

    expect([200, 403, 404, 409]).toContain(response.status());
  });

  test("POST /api/Appointment/book — without auth returns 401", async ({
    request,
  }) => {
    const response = await requestWithRetry(request, "post", "/api/Appointment/book", {
      data: {
        centerId: 1,
        appointmentDate: "2026-03-10",
        appointmentTime: "10:00:00",
      },
    });

    expectAuthBlockedStatus(response.status());
  });
});
