import { test, expect } from "@playwright/test";
import { getAuthToken } from "../helpers/auth.helper";

// ─────────────────────────────────────────────────────────────
// Appointment Smoke Tests — /api/Appointment
// ─────────────────────────────────────────────────────────────

test.describe("Appointment Smoke Tests", () => {
  test("GET /api/Appointment/my-bookings — with auth returns 200", async ({
    request,
  }) => {
    const token = await getAuthToken(request);

    const response = await request.get("/api/Appointment/my-bookings", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("data");
  });

  test("GET /api/Appointment/my-bookings — without auth returns 401", async ({
    request,
  }) => {
    const response = await request.get("/api/Appointment/my-bookings");

    expect(response.status()).toBe(401);
  });

  test("POST /api/Appointment/book — with auth returns 200 or 404/409", async ({
    request,
  }) => {
    const token = await getAuthToken(request);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request.post("/api/Appointment/book", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        centerId: 1,
        appointmentDate: tomorrow.toISOString().split("T")[0],
        appointmentTime: "10:00:00",
      },
    });

    // 200 = booked, 404 = center not found, 409 = conflict/already booked
    expect([200, 404, 409]).toContain(response.status());
  });

  test("POST /api/Appointment/book — without auth returns 401", async ({
    request,
  }) => {
    const response = await request.post("/api/Appointment/book", {
      data: {
        centerId: 1,
        appointmentDate: "2026-03-10",
        appointmentTime: "10:00:00",
      },
    });

    expect(response.status()).toBe(401);
  });
});
