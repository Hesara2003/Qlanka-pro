// Admin User Management API — SCRUM-77/83
import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import type { AdminUser, GetUsersParams, GetUsersResponse } from "../types/user";

/** Shape of every error body returned by ExceptionMiddleware. */
interface ApiErrorBody {
  code?: string;
  message?: string;
}

/** Known error codes emitted by the user-management endpoints. */
const USER_ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND:        "User not found or has already been deleted.",
  CANNOT_DELETE_ADMIN:   "Admin accounts cannot be deleted.",
  INVALID_USER_ID:       "Invalid user ID supplied.",
  INVALID_ROLE_FILTER:   "Invalid role filter. Allowed values: citizen, officer, admin.",
  DATA_ACCESS_ERROR:     "A database error occurred. Please try again later.",
  TOKEN_MISSING:         "Your session has expired. Please log in again.",
  TOKEN_INVALID:         "Your session has expired. Please log in again.",
  FORBIDDEN:             "You do not have permission to perform this action.",
};

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiErrorBody;
    if (data.code && USER_ERROR_MESSAGES[data.code]) {
      return USER_ERROR_MESSAGES[data.code];
    }
    return data.message ?? "An unexpected error occurred.";
  }
  if (error instanceof AxiosError && error.code === "ECONNABORTED") {
    return "Request timeout. Please try again.";
  }
  if (error instanceof AxiosError && !error.response) {
    return "Network error. Please check your connection and try again.";
  }
  return "Failed to connect to service. Please try again.";
}

/**
 * GET /api/admin/users
 * Returns all non-deleted users. Admin only.
 */
export async function getAdminUsers(params?: GetUsersParams): Promise<AdminUser[]> {
  try {
    const { data } = await axiosInstance.get<GetUsersResponse>("/api/admin/users", {
      params,
    });
    return data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * DELETE /api/admin/users/:id
 * Soft-deletes the user. Admin only.
 */
export async function deleteAdminUser(userId: number): Promise<void> {
  try {
    await axiosInstance.delete(`/api/admin/users/${userId}`);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
