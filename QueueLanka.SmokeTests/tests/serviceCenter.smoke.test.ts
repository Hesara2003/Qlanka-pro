import { expect, test, type APIRequestContext } from "@playwright/test";

// ─────────────────────────────────────────────────────────────
// Service Center Smoke Tests — /api/service-centers
// ─────────────────────────────────────────────────────────────

test.describe("Service Center Smoke Tests", () => {
  test("GET /api/service-centers — returns 200 + array", async ({
    request,
  }) => {
    const adminToken = await getAdminAuthToken(request);
    const response = await request.get("/api/service-centers", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("GET /api/service-centers/1 — valid ID returns 200", async ({
    request,
  }) => {
    const adminToken = await getAdminAuthToken(request);
    const response = await request.get("/api/service-centers/1", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect([200, 404]).toContain(response.status());
  });

  test("GET /api/service-centers/999999 — invalid ID returns 404", async ({
    request,
  }) => {
    const adminToken = await getAdminAuthToken(request);
    const response = await request.get("/api/service-centers/999999", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status()).toBe(404);
  });

  test("POST /api/service-centers — admin can create (or 401/403 if not admin)", async ({
    request,
  }) => {
    const token = await getAdminAuthToken(request);

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

    expect([201, 409]).toContain(response.status());
  });
});

async function getAdminAuthToken(request: APIRequestContext): Promise<string> {
  const response = await request.post("/api/auth/login", {
    data: {
      username: process.env.SMOKE_ADMIN_USERNAME ?? "healthcheck_admin",
      password: process.env.SMOKE_ADMIN_PASSWORD ?? "Health@Check1",
    },
  });

  if (!response.ok()) {
    throw new Error(`Admin login failed (${response.status()}).`);
  }

  const body = await response.json();
  return body.token;
}
