import { test, expect } from "@playwright/test";
import { getAuthToken } from "../helpers/auth.helper";

// ─────────────────────────────────────────────────────────────
// Token Smoke Tests — /api/Token
// ─────────────────────────────────────────────────────────────

test.describe("Token Smoke Tests", () => {
  test("GET /api/Token/my-tokens — with auth returns 200", async ({
    request,
  }) => {
    const token = await getAuthToken(request);

    const response = await request.get("/api/Token/my-tokens", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
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
    const token = await getAuthToken(request);

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
