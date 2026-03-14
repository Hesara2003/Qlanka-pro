import { test, expect } from "@playwright/test";
import { getAuthToken } from "../helpers/auth.helper";

// ─────────────────────────────────────────────────────────────
// Service Center Smoke Tests — /api/service-centers
// ─────────────────────────────────────────────────────────────

test.describe("Service Center Smoke Tests", () => {
  test("GET /api/service-centers — returns 200 + array", async ({
    request,
  }) => {
    const response = await request.get("/api/service-centers");

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("GET /api/service-centers/1 — valid ID returns 200", async ({
    request,
  }) => {
    const response = await request.get("/api/service-centers/1");

    // 200 if it exists, 404 if not — both are acceptable for a smoke test
    expect([200, 404]).toContain(response.status());
  });

  test("GET /api/service-centers/999999 — invalid ID returns 404", async ({
    request,
  }) => {
    const response = await request.get("/api/service-centers/999999");

    expect(response.status()).toBe(404);
  });

  test("POST /api/service-centers — admin can create (or 401/403 if not admin)", async ({
    request,
  }) => {
    const token = await getAuthToken(request);

    const response = await request.post("/api/service-centers", {
      headers: { Authorization: `Bearer ${token}` },
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

    // 201 = created, 403 = user is not admin, 409 = already exists
    expect([201, 403, 409]).toContain(response.status());
  });
});
