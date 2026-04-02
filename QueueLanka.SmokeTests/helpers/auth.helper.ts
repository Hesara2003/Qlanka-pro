import { APIRequestContext } from "@playwright/test";

const TEST_USER = {
  username: process.env.SMOKE_USERNAME ?? "healthcheck_citizen",
  password: process.env.SMOKE_PASSWORD ?? "Health@Check1",
};

export async function getAuthToken(request: APIRequestContext): Promise<string> {
  const response = await request.post("/api/auth/login", {
    data: TEST_USER,
  });

  if (!response.ok()) {
    throw new Error(
      `Login failed (${response.status()}). ` +
        `Ensure SMOKE_USERNAME/SMOKE_PASSWORD are valid for ${process.env.SMOKE_BASE_URL ?? "the configured baseURL"}.`
    );
  }

  const body = await response.json();
  return body.token;
}
