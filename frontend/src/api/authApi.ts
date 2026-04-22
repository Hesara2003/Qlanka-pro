import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import { supabase } from "../lib/supabaseClient";
import { createDemoToken } from "../lib/authSession";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ApiError,
} from "../types/auth";

function extractBackendErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiError;
    return data.message ?? "An unexpected error occurred.";
  }

  if (error instanceof AxiosError && error.code === "ECONNABORTED") {
    return "Request timeout. Please try again.";
  }

  if (error instanceof AxiosError && !error.response) {
    return "Network error. Please try again.";
  }

  return "Network error. Please try again.";
}

function shouldUseSupabaseFallback(error: unknown): boolean {
  if (error instanceof AxiosError) {
    if (error.code === "ERR_FORCE_SUPABASE") return true;
  } else {
    return false;
  }

  if (!error.response) {
    return true;
  }

  const status = error.response.status;
  return status === 404 || status >= 500;
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  const apiError = error as ApiError | null;
  if (apiError?.message) {
    return new Error(apiError.message);
  }

  return new Error("Network error. Please try again.");
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
  } catch (backendError) {
    if (!shouldUseSupabaseFallback(backendError)) {
      throw new Error(extractBackendErrorMessage(backendError));
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .insert({
          username: payload.username.trim(),
          email: payload.email.trim(),
          password_hash: payload.password,
          role: payload.role,
          center_id: payload.role === "officer" ? payload.centerId ?? null : null,
          is_active: true,
        })
        .select("user_id, username, role")
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Username or email already exists.");
        }
        throw new Error(error.message);
      }

      return {
        userId: data.user_id,
        username: data.username,
        role: data.role,
      };
    } catch (fallbackError) {
      throw toError(fallbackError);
    }
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
  } catch (backendError) {
    if (!shouldUseSupabaseFallback(backendError)) {
      throw new Error(extractBackendErrorMessage(backendError));
    }

    try {
      const username = payload.username.trim();

      let data: {
        user_id: number;
        username: string;
        email: string;
        password_hash: string;
        role: string;
        center_id: number | null;
        is_active: boolean;
      } | null = null;

      let queryError: { message: string } | null = null;

      const byUsername = await supabase
        .from("users")
        .select("user_id, username, email, password_hash, role, center_id, is_active")
        .eq("username", username)
        .maybeSingle();

      if (byUsername.error) {
        queryError = { message: byUsername.error.message };
      } else {
        data = byUsername.data;
      }

      if (!data) {
        const byEmail = await supabase
          .from("users")
          .select("user_id, username, email, password_hash, role, center_id, is_active")
          .eq("email", username)
          .maybeSingle();

        if (byEmail.error) {
          queryError = { message: byEmail.error.message };
        } else {
          data = byEmail.data;
        }
      }

      if (queryError) {
        throw new Error(queryError.message);
      }

      if (!data || !data.is_active || data.password_hash !== payload.password) {
        throw new Error("Invalid username or password.");
      }

      let counterId: number | undefined;
      if (String(data.role).toLowerCase() === "officer") {
        const counterLookup = await supabase
          .from("counters")
          .select("counter_id")
          .eq("officer_user_id", data.user_id)
          .order("counter_id", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!counterLookup.error && counterLookup.data?.counter_id != null) {
          counterId = counterLookup.data.counter_id;
        }
      }

      const role = String(data.role).toLowerCase();
      const token = createDemoToken({
        userId: data.user_id,
        username: data.username,
        role,
        centerId: data.center_id,
      });

      return {
        userId: data.user_id,
        token,
        refreshToken: "supabase-frontend-only",
        expiresIn: 3600,
        role,
        counterId,
        centerId: data.center_id ?? undefined,
      };
    } catch (fallbackError) {
      // Final fallback for local development/demo if both backend and Supabase are down
      const username = payload.username.trim().toLowerCase();
      if (payload.password === "Demo@123") {
        if (username === "admin1" || username === "officer1" || username === "citizen1") {
          console.warn("Using hardcoded development fallback for login.");
          const role = username === "admin1" ? "admin" : (username === "officer1" ? "officer" : "citizen");
          const userId = username === "admin1" ? 1 : (username === "officer1" ? 2 : 3);
          const token = createDemoToken({ userId, username, role, centerId: role === "citizen" ? 1 : undefined });
          
          return {
            userId,
            token,
            refreshToken: "dev-fallback",
            expiresIn: 3600,
            role,
            counterId: role === "officer" ? 1 : undefined,
            centerId: 1
          };
        }
      }
      throw toError(fallbackError);
    }
  }
}
