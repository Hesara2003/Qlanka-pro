import { APIRequestContext } from "@playwright/test";

// ── Test credentials ──────────────────────────────────────────
// Change these to match a real seeded user in your database.
const TEST_USER = {
  username: "healthcheck_citizen",
  password: "Health@Check1",
};

/**
 * Logs in with test credentials and returns the JWT token.
 * Call this at the top of any test that needs authentication.
 */
export async function getAuthToken(
  request: APIRequestContext
): Promise<string> {
  const response = await request.post("/api/auth/login", {
    data: TEST_USER,
  });

  if (!response.ok()) {
    throw new Error(
      `Login failed (${response.status()}). ` +
        `Make sure the test user "${TEST_USER.username}" exists in the database.`
    );
  }

  const body = await response.json();
  return body.token; // LoginResponseDto is a flat object: { token, refreshToken, expiresIn, role }
}
