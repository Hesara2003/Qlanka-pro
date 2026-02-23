import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ApiError,
  PasswordResetResponse,
  VerifyEmailResponse,
} from "../types/auth";

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiError;
    return data.message ?? "An unexpected error occurred.";
  }
  return "Network error. Please try again.";
}

export async function registerUser(
  payload: RegisterRequest
): Promise<RegisterResponse> {
  try {
    const { data } = await axiosInstance.post<RegisterResponse>(
      "/api/auth/register",
      payload
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function loginUser(
  payload: LoginRequest
): Promise<LoginResponse> {
  try {
    const { data } = await axiosInstance.post<LoginResponse>(
      "/api/auth/login",
      payload
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function forgotPassword(
  email: string
): Promise<PasswordResetResponse> {
  try {
    const { data } = await axiosInstance.post<PasswordResetResponse>(
      "/api/auth/forgot-password",
      { email }
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<PasswordResetResponse> {
  try {
    const { data } = await axiosInstance.post<PasswordResetResponse>(
      "/api/auth/reset-password",
      { token, newPassword, confirmPassword }
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function verifyEmail(
  token: string
): Promise<VerifyEmailResponse> {
  try {
    const { data } = await axiosInstance.get<VerifyEmailResponse>(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
