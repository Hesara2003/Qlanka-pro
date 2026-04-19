// Admin User Management API — SCRUM-77/83
import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import { supabase } from "../lib/supabaseClient";
import { shouldUseSupabaseFallback } from "./fallbackUtils";
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
    if (!shouldUseSupabaseFallback(error)) {
      throw new Error(extractErrorMessage(error));
    }

    let query = supabase
      .from("users")
      .select("user_id, username, email, role, center_id, is_active, created_at")
      .order("user_id", { ascending: true });

    if (params?.role) {
      query = query.eq("role", params.role);
    }

    if (typeof params?.isActive === "boolean") {
      query = query.eq("is_active", params.isActive);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      throw new Error(dbError.message);
    }

    return (data ?? []).map((user) => ({
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      centerId: user.center_id,
      isActive: Boolean(user.is_active),
      isEmailVerified: true,
      createdAt: user.created_at,
      updatedAt: null,
      lastLoginAt: null,
      isDeleted: false,
    }));
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
    if (!shouldUseSupabaseFallback(error)) {
      throw new Error(extractErrorMessage(error));
    }

    const { data: user, error: lookupError } = await supabase
      .from("users")
      .select("user_id, role")
      .eq("user_id", userId)
      .maybeSingle();

    if (lookupError) {
      throw new Error(lookupError.message);
    }

    if (!user) {
      throw new Error("User not found or has already been deleted.");
    }

    if (String(user.role).toLowerCase() === "admin") {
      throw new Error("Admin accounts cannot be deleted.");
    }

    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return;
  }
}
