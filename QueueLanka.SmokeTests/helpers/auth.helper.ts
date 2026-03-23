import { APIRequestContext } from "@playwright/test";
import { tryGetAuthToken } from "./smoke.helper";

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
  const result = await tryGetAuthToken(request);

  if (!result.ok || !result.token) {
    throw new Error(
      `Login failed (${result.status ?? "network"}). ` +
        `Make sure the test user "${TEST_USER.username}" exists in the database.`
    );
  }

  return result.token;
}
