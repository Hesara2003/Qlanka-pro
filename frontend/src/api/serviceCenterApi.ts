// Service Center API Integration - SCRUM-25
import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import { supabase } from "../lib/supabaseClient";
import { shouldUseSupabaseFallback } from "./fallbackUtils";
import type {
  ServiceCenter,
  ServiceCenterApiError,
  ApiResponse,
  CreateServiceCenterRequest,
  CenterLocation,
  UpsertLocationRequest,
} from "../types/serviceCenter";

// Error handling utility
function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ServiceCenterApiError;
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

function mapDbCenter(center: {
  center_id: number;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  description: string | null;
  timezone: string | null;
  capacity: number | null;
  opening_time: string | null;
  closing_time: string | null;
  is_active: boolean | null;
  created_at: string;
}): ServiceCenter {
  return {
    centerId: center.center_id,
    name: center.name,
    address: center.address,
    phone: center.phone ?? undefined,
    email: center.email ?? undefined,
    description: center.description ?? undefined,
    timezone: center.timezone ?? "Asia/Colombo",
    capacity: center.capacity ?? 100,
    averageServiceTimeMinutes: 10,
    openingTime: center.opening_time ?? "08:00:00",
    closingTime: center.closing_time ?? "17:00:00",
    isAvailable: Boolean(center.is_active),
    isActive: Boolean(center.is_active),
    createdAt: center.created_at,
  };
}

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Do not retry client errors (4xx)
      if (
        error instanceof AxiosError &&
        error.response?.status &&
        error.response.status >= 400 &&
        error.response.status < 500
      ) {
        throw error;
      }

      // Wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Fetch all service centers
 */
export async function getAllServiceCenters(): Promise<ServiceCenter[]> {
  try {
    return await retryWithBackoff(async () => {
      const { data } = await axiosInstance.get<ApiResponse<ServiceCenter[]>>(
        "/api/service-centers"
      );
      return data.data;
    });
  } catch (error) {
    if (!shouldUseSupabaseFallback(error)) {
      throw new Error(extractErrorMessage(error));
    }

    const { data, error: dbError } = await supabase
      .from("service_centers")
      .select("center_id, name, address, phone, email, description, timezone, capacity, opening_time, closing_time, is_active, created_at")
      .order("name", { ascending: true });

    if (dbError) {
      throw new Error(dbError.message);
    }

    return (data ?? []).map(mapDbCenter);
  }
}

/**
 * Fetch service center by ID
 */
export async function getServiceCenterById(
  centerId: number
): Promise<ServiceCenter> {
  try {
    return await retryWithBackoff(async () => {
      const { data } = await axiosInstance.get<ApiResponse<ServiceCenter>>(
        `/api/service-centers/${centerId}`
      );
      return data.data;
    });
  } catch (error) {
    if (!shouldUseSupabaseFallback(error)) {
      throw new Error(extractErrorMessage(error));
    }

    const { data, error: dbError } = await supabase
      .from("service_centers")
      .select("center_id, name, address, phone, email, description, timezone, capacity, opening_time, closing_time, is_active, created_at")
      .eq("center_id", centerId)
      .maybeSingle();

    if (dbError) {
      throw new Error(dbError.message);
    }

    if (!data) {
      throw new Error("Service center not found.");
    }

    return mapDbCenter(data);
  }
}

/**
 * Get only available service centers
 */
export async function getAvailableServiceCenters(): Promise<ServiceCenter[]> {
  try {
    const centers = await getAllServiceCenters();
    return centers.filter(
      (center) => center.isAvailable && center.isActive
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Create a new service center (admin only)
 * Does NOT use retry — write operations must not be silently re-issued.
 */
export async function createServiceCenter(
  payload: CreateServiceCenterRequest
): Promise<ServiceCenter> {
  try {
    const { data } = await axiosInstance.post<ApiResponse<ServiceCenter>>(
      "/api/service-centers",
      payload
    );
    return data.data;
  } catch (error) {
    if (!shouldUseSupabaseFallback(error)) {
      // Re-throw AxiosError so the page can inspect .response.data.code
      if (error instanceof AxiosError) throw error;
      throw new Error(extractErrorMessage(error));
    }

    const { data, error: dbError } = await supabase
      .from("service_centers")
      .insert({
        name: payload.name,
        address: payload.address,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        description: payload.description ?? null,
        timezone: payload.timezone,
        capacity: payload.capacity,
        opening_time: payload.openingTime,
        closing_time: payload.closingTime,
        is_active: payload.isActive,
      })
      .select("center_id, name, address, phone, email, description, timezone, capacity, opening_time, closing_time, is_active, created_at")
      .single();

    if (dbError) {
      throw new Error(dbError.message);
    }

    return mapDbCenter(data);
  }
}

/**
 * Check service center availability
 */
export async function checkServiceCenterAvailability(
  centerId: number
): Promise<boolean> {
  try {
    const center = await getServiceCenterById(centerId);
    return center.isAvailable && center.isActive;
  } catch (error) {
    console.error("Error checking availability:", error);
    return false;
  }
}

/**
 * Update active/inactive status for a service center (admin only)
 */
export async function updateServiceCenterStatus(
  centerId: number,
  isActive: boolean,
  reason = "Updated via admin console"
): Promise<ServiceCenter> {
  try {
    const { data } = await axiosInstance.patch<ApiResponse<ServiceCenter>>(
      `/api/service-centers/${centerId}/status`,
      { isActive, reason }
    );
    return data.data;
  } catch (error) {
    if (!shouldUseSupabaseFallback(error)) {
      if (error instanceof AxiosError) throw error;
      throw new Error(extractErrorMessage(error));
    }

    const { data, error: dbError } = await supabase
      .from("service_centers")
      .update({ is_active: isActive })
      .eq("center_id", centerId)
      .select("center_id, name, address, phone, email, description, timezone, capacity, opening_time, closing_time, is_active, created_at")
      .maybeSingle();

    if (dbError) {
      throw new Error(dbError.message);
    }

    if (!data) {
      throw new Error("Service center not found.");
    }

    return mapDbCenter(data);
  }
}

/**
 * Get structured location details for a service center
 */
export async function getServiceCenterLocation(
  centerId: number
): Promise<CenterLocation> {
  try {
    const { data } = await axiosInstance.get<ApiResponse<CenterLocation>>(
      `/api/service-centers/${centerId}/location`
    );
    return data.data;
  } catch (error) {
    if (error instanceof AxiosError) throw error;
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Create or update location for a service center (admin only)
 */
export async function upsertServiceCenterLocation(
  centerId: number,
  payload: UpsertLocationRequest
): Promise<CenterLocation> {
  try {
    const { data } = await axiosInstance.put<ApiResponse<CenterLocation>>(
      `/api/service-centers/${centerId}/location`,
      payload
    );
    return data.data;
  } catch (error) {
    if (error instanceof AxiosError) throw error;
    throw new Error(extractErrorMessage(error));
  }
}