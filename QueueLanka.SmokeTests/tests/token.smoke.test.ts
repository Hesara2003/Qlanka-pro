import { test, expect, type APIRequestContext } from "@playwright/test";

// ─────────────────────────────────────────────────────────────
// Token Smoke Tests — /api/Token
// ─────────────────────────────────────────────────────────────

test.describe("Token Smoke Tests", () => {
  test("GET /api/Token/my-tokens — with auth returns 200", async ({
    request,
  }) => {
    const token = await getAdminAuthToken(request);

    const response = await request.get("/api/Token/my-tokens", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    const tokens = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(tokens)).toBe(true);
  });

  test("GET /api/Token/my-tokens — without auth returns 401", async ({
    request,
  }) => {
    const response = await request.get("/api/Token/my-tokens");

    expect(response.status()).toBe(401);
  });

  test("PUT /api/Token/999999/cancel — invalid token ID returns 404", async ({
    request,
  }) => {
    const token = await getAdminAuthToken(request);

    const response = await request.put("/api/Token/999999/cancel", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 404 = not found, which is expected for an invalid ID
    expect(response.status()).toBe(404);
  });

  test("PUT /api/Token/1/cancel — without auth returns 401", async ({
    request,
  }) => {
    const response = await request.put("/api/Token/1/cancel");

    expect(response.status()).toBe(401);
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
