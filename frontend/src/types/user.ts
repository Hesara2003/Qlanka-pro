// User management types — SCRUM-77

import type { ApiResponse } from "./serviceCenter";

export type UserRole = "citizen" | "officer" | "admin";

export interface AdminUser {
  userId: number;
  username: string;
  email: string;
  role: UserRole;
  centerId: number | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string | null;
  lastLoginAt: string | null;
  /** true when deletedAt is populated — soft-deleted accounts */
  isDeleted: boolean;
}

export interface GetUsersParams {
  role?: UserRole;
  isActive?: boolean;
}

export type GetUsersResponse = ApiResponse<AdminUser[]>;
export type DeleteUserResponse = ApiResponse<null>;
