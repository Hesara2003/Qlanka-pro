// frontend/src/api/axiosInstance.ts

import axios from "axios";

const rawApiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ??
  "https://qlanka-gateway.redrock-2a740b8b.centralindia.azurecontainerapps.io"
).replace(/\/+$/, "");

const apiBaseUrl = rawApiBaseUrl.replace(/\/api$/i, "");

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

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// Attach JWT token to every request if present
axiosInstance.interceptors.request.use((config) => {
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
