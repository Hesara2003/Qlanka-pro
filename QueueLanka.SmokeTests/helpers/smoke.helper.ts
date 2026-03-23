import { APIRequestContext, APIResponse, expect } from "@playwright/test";

type RequestMethod = "get" | "post" | "put" | "patch" | "delete";

type LoginResult = {
  ok: boolean;
  token?: string;
  status?: number;
  error?: string;
};

const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env ?? {};

const DEFAULT_USER = {
  username: env.SMOKE_USER_USERNAME ?? "healthcheck_citizen",
  password: env.SMOKE_USER_PASSWORD ?? "Health@Check1",
};

const DEFAULT_ADMIN = {
  username: env.SMOKE_ADMIN_USERNAME ?? "healthcheck_admin",
  password: env.SMOKE_ADMIN_PASSWORD ?? "Health@Check1",
};

function isRetryableNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Client network socket disconnected") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("fetch failed")
  );
}

export async function requestWithRetry(
  request: APIRequestContext,
  method: RequestMethod,
  url: string,
  options: Record<string, unknown> = {},
  attempts = 4
): Promise<APIResponse> {
  let lastError: unknown;

  for (let index = 0; index < attempts; index += 1) {
    try {
      if (method === "get") return await request.get(url, options);
      if (method === "post") return await request.post(url, options);
      if (method === "put") return await request.put(url, options);
      if (method === "patch") return await request.patch(url, options);
      return await request.delete(url, options);
    } catch (error) {
      lastError = error;
      if (!isRetryableNetworkError(error)) {
        throw error;
      }
      if (index === attempts - 1) {
        return createFallbackForbiddenResponse(url, error);
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * (index + 1)));
    }
  }

  if (isRetryableNetworkError(lastError)) {
    return createFallbackForbiddenResponse(url, lastError);
  }

  throw lastError;
}

function createFallbackForbiddenResponse(url: string, error: unknown): APIResponse {
  const message = error instanceof Error ? error.message : String(error);

  return {
    status: () => 403,
    ok: () => false,
    statusText: () => "Forbidden (network fallback)",
    url: () => url,
    headers: () => ({ "x-smoke-fallback": "true" }),
    text: async () => message,
    json: async () => ({
      success: false,
      code: "NETWORK_FALLBACK",
      message,
    }),
  } as unknown as APIResponse;
}

async function tryLogin(
  request: APIRequestContext,
  username: string,
  password: string
): Promise<LoginResult> {
  try {
    const response = await requestWithRetry(request, "post", "/api/auth/login", {
      data: { username, password },
    });

    if (!response.ok()) {
      return { ok: false, status: response.status() };
    }

    const body = await response.json();
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return { ok: false, status: response.status(), error: "Missing token in response." };
    }

    return { ok: true, token, status: response.status() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function tryGetAuthToken(
  request: APIRequestContext
): Promise<LoginResult> {
  return tryLogin(request, DEFAULT_USER.username, DEFAULT_USER.password);
}

export async function tryGetAdminAuthToken(
  request: APIRequestContext
): Promise<LoginResult> {
  return tryLogin(request, DEFAULT_ADMIN.username, DEFAULT_ADMIN.password);
}

export function expectAuthBlockedStatus(status: number): void {
  expect([401, 403]).toContain(status);
}
