// Admin User Management API — SCRUM-77
import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import type { AdminUser, GetUsersParams, GetUsersResponse } from "../types/user";

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as { message?: string };
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
