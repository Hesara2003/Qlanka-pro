import type { AuthUser } from "../types/auth";

interface SessionUser {
  token: string;
  userId: number;
  role: string;
  centerId?: number;
  username?: string;
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return atob(padded);
}

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    return JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function createDemoToken(payload: {
  userId: number;
  username: string;
  role: string;
  centerId?: number | null;
}): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const body: Record<string, unknown> = {
    sub: String(payload.userId),
    unique_name: payload.username,
    role: payload.role,
    exp,
  };

  if (payload.centerId != null) {
    body.centerId = String(payload.centerId);
  }

  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

  const unsigned = `${encode(header)}.${encode(body)}`;
  return `${unsigned}.demo-signature`;
}

export function getSessionUser(): SessionUser | null {
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  const payload = parseJwtPayload(token);
  const authUserRaw = localStorage.getItem("auth_user");
  let authUser: Partial<AuthUser> = {};

  if (authUserRaw) {
    try {
      authUser = JSON.parse(authUserRaw) as Partial<AuthUser>;
    } catch {
      authUser = {};
    }
  }

  const subValue = payload?.sub;
  const roleValue = payload?.role ?? authUser.role;

  const userId = Number(subValue);
  if (!Number.isFinite(userId) || !roleValue || typeof roleValue !== "string") {
    return null;
  }

  const centerIdValue = payload?.centerId;
  const parsedCenterId = typeof centerIdValue === "string" ? Number(centerIdValue) : undefined;

  return {
    token,
    userId,
    role: roleValue.toLowerCase(),
    centerId: Number.isFinite(parsedCenterId) ? parsedCenterId : authUser.centerId,
    username:
      (typeof payload?.unique_name === "string" && payload.unique_name)
      || authUser.username,
  };
}

export function requireSessionUser(): SessionUser {
  const session = getSessionUser();
  if (!session) {
    throw new Error("Your session has expired. Please sign in again.");
  }
  return session;
}
