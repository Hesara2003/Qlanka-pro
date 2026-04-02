import { test, expect } from "@playwright/test";

const TEST_USER = {
  username: process.env.SMOKE_USERNAME ?? "healthcheck_citizen",
  password: process.env.SMOKE_PASSWORD ?? "Health@Check1",
};

// ─────────────────────────────────────────────────────────────
// Auth Smoke Tests — POST /api/auth/login
// ─────────────────────────────────────────────────────────────

test.describe("Auth Smoke Tests", () => {
  test("POST /api/auth/login — valid credentials returns 200 + token", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/login", {
      data: TEST_USER,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    // LoginResponseDto is flat: { token, refreshToken, expiresIn, role }
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
  });

  test("POST /api/auth/login — invalid credentials returns 401", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/login", {
      data: {
        username: "wronguser",
        password: "WrongPassword!",
      },
    });

    expect(response.status()).toBe(401);
  });
});
