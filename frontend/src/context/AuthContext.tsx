// frontend/src/context/AuthContext.tsx
// WSO2 IS integration: token is now issued by WSO2 IS (access token via ROPC).
// The backend still accepts the token and the API response shape is unchanged.
// Only the JWT claim parsing needs to handle WSO2 claim names alongside the
// legacy local-JWT claim names so any tokens in localStorage during the cutover
// continue to work until they expire.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import type { AuthUser } from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: () => boolean;
  isOfficer: () => boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── JWT payload interface ─────────────────────────────────────────────────────
// Supports both legacy local-JWT claims and WSO2 IS access-token claims.
interface JwtPayload {
  // Standard OIDC / WSO2 claims
  sub?: string;              // WSO2: user subject (userId or username)
  preferred_username?: string; // WSO2: username (if userinfo included in token)

  // Legacy local-JWT claims (backward compat during cutover)
  unique_name?: string;
  name?: string;

  // Role claims — WSO2 can emit as string or string[]
  role?: string | string[];
  roles?: string | string[];

  // Legacy .NET claim URIs (backward compat)
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;

  // WSO2 authorised party (presence confirms WSO2-issued token)
  azp?: string;

  // Expiry
  exp?: number;

  // Custom qlanka claim (legacy local-JWT; not present in WSO2 token)
  centerId?: string;
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts the role string from a JWT payload.
 * WSO2 IS may emit roles as a JSON array; we take the first relevant role value.
 * Priority: roles[] → role → legacy .NET claim → persisted value.
 */
function extractRole(payload: JwtPayload, persistedRole?: string): string | undefined {
  const candidates: Array<string | string[] | undefined> = [
    payload.roles,
    payload.role,
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
    persistedRole,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (Array.isArray(candidate)) {
      // WSO2 often includes internal WSO2 roles — filter to known app roles
      const appRole = candidate.find((r) =>
        ["citizen", "officer", "admin"].includes(r.toLowerCase())
      );
      if (appRole) return appRole.toLowerCase();
      // Fallback: first entry
      if (candidate.length > 0) return candidate[0].toLowerCase();
    } else if (typeof candidate === "string" && candidate) {
      return candidate.toLowerCase();
    }
  }

  return undefined;
}

/**
 * Extracts the display username from a JWT payload.
 * WSO2 IS uses 'preferred_username' or 'sub'; legacy local-JWT used 'unique_name'.
 */
function extractUsername(payload: JwtPayload, persistedUsername?: string): string {
  return (
    persistedUsername ??
    payload.preferred_username ??
    payload.unique_name ??
    payload.name ??
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
    payload.sub ??
    ""
  );
}

function buildUserFromStorage(): AuthUser | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = parseJwtPayload(token);

  const rawUser = localStorage.getItem("auth_user");
  let persistedUser: Partial<AuthUser> = {};
  if (rawUser) {
    try {
      persistedUser = JSON.parse(rawUser) as Partial<AuthUser>;
    } catch {
      persistedUser = {};
    }
  }

  // Token expiry check
  if (payload?.exp && payload.exp * 1000 <= Date.now()) {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user");
    return null;
  }

  const role = payload
    ? extractRole(payload, persistedUser.role)
    : persistedUser.role?.toLowerCase();

  if (!role) {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user");
    return null;
  }

  const username = payload
    ? extractUsername(payload, persistedUser.username)
    : (persistedUser.username ?? "");

  // centerId: present in legacy local-JWT as a custom claim.
  // WSO2 access tokens do NOT carry centerId — it comes from the auth API response
  // and is persisted in auth_user by the login handler.
  const centerId =
    payload?.centerId ? parseInt(payload.centerId, 10) : persistedUser.centerId;

  return {
    username,
    role,
    token,
    counterId: persistedUser.counterId,
    centerId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(buildUserFromStorage());
    setIsLoading(false);

    const onLogout = () => {
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const login = useCallback((authUser: AuthUser) => {
    const payload = parseJwtPayload(authUser.token);
    const normalizedUser: AuthUser = {
      ...authUser,
      role: authUser.role.toLowerCase(),
      // centerId from the API response takes precedence over any JWT claim,
      // since WSO2 access tokens don't carry centerId.
      centerId: authUser.centerId ?? (payload?.centerId ? parseInt(payload.centerId, 10) : undefined),
    };

    localStorage.setItem("token", normalizedUser.token);
    localStorage.setItem("auth_user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user");
    setUser(null);

    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }, []);

  const isAdmin   = useCallback(() => user?.role.toLowerCase() === "admin",   [user]);
  const isOfficer = useCallback(() => user?.role.toLowerCase() === "officer", [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      isAdmin,
      isOfficer,
      login,
      logout,
    }),
    [user, isLoading, isAdmin, isOfficer, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
