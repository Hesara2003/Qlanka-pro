// frontend/src/api/axiosInstance.ts

import axios from "axios";

const isWso2Enabled = (import.meta.env.VITE_WSO2_ENABLED ?? "false").toLowerCase() === "true";

const rawApiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_WSO2_API_BASE_URL ??
  (window.location.hostname === "localhost" ? "http://localhost:5012" : "https://20.193.250.12:9443")
).replace(/\/+$/, "");

const apiBaseUrl = rawApiBaseUrl.replace(/\/api$/i, "");

const wso2PublicContext = (import.meta.env.VITE_WSO2_PUBLIC_CONTEXT ?? "/public/v1").replace(/\/+$/, "");
const wso2OfficerContext = (import.meta.env.VITE_WSO2_OFFICER_CONTEXT ?? "/officer/v1").replace(/\/+$/, "");
const wso2AdminContext = (import.meta.env.VITE_WSO2_ADMIN_CONTEXT ?? "/admin/v1").replace(/\/+$/, "");

function resolveWso2ContextForPath(path: string): string {
  if (path.startsWith("/api/admin") || path.startsWith("/api/reports")) {
    return wso2AdminContext;
  }

  if (path.startsWith("/api/counters")) {
    return wso2OfficerContext;
  }

  return wso2PublicContext;
}

export class AuthorizationError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code = "AUTH_FORBIDDEN", status = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
    this.status = status;
  }
}

export const FORCE_SUPABASE = true;

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Attach JWT token to every request if present
axiosInstance.interceptors.request.use((config) => {
  if (FORCE_SUPABASE) {
    return Promise.reject(new axios.AxiosError("Forced Supabase fallback", "ERR_FORCE_SUPABASE", config));
  }
  if (isWso2Enabled && typeof config.url === "string" && config.url.startsWith("/")) {
    const isAlreadyContextualized =
      config.url.startsWith(`${wso2PublicContext}/`) ||
      config.url.startsWith(`${wso2OfficerContext}/`) ||
      config.url.startsWith(`${wso2AdminContext}/`);

    if (!isAlreadyContextualized) {
      config.url = `${resolveWso2ContextForPath(config.url)}${config.url}`;
    }
  }

  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: convert HTTP errors into readable messages
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("auth_user");
        window.dispatchEvent(new CustomEvent("auth:logout"));

        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?reason=session_expired";
        }
      }

      if (status === 403) {
        return Promise.reject(
          new AuthorizationError("You do not have permission to perform this action")
        );
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
