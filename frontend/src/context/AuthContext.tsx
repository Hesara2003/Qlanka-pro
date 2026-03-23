// frontend/src/context/AuthContext.tsx

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

interface JwtPayload {
  sub?: string;
  unique_name?: string;
  name?: string;
  role?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
  exp?: number;
  centerId?: string;
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch {
    return null;
  }
}

function buildUserFromStorage(): AuthUser | null {
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }
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

  const roleClaim = payload?.role
    ?? payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
    ?? persistedUser.role;

  if (!roleClaim) {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user");
    return null;
  }

  if (payload?.exp && payload.exp * 1000 <= Date.now()) {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user");
    return null;
  }

  return {
    username:
      persistedUser.username
      ?? payload?.unique_name
      ?? payload?.name
      ?? payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"]
      ?? "",
    role: roleClaim.toLowerCase(),
    token,
    counterId: persistedUser.counterId,
    centerId: payload?.centerId ? parseInt(payload.centerId, 10) : persistedUser.centerId,
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
      centerId: payload?.centerId ? parseInt(payload.centerId, 10) : authUser.centerId,
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

  const isAdmin = useCallback(() => user?.role.toLowerCase() === "admin", [user]);
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
