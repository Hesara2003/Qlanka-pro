// Service Center API Integration - SCRUM-25
import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import type { ServiceCenter, ServiceCenterApiError } from "../types/serviceCenter";

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

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors)
      if (error instanceof AxiosError && error.response?.status && 
          error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Fetch all service centers from the API with retry logic
 * @returns Promise<ServiceCenter[]>
 */
export async function getAllServiceCenters(): Promise<ServiceCenter[]> {
  try {
    const result = await retryWithBackoff(async () => {
      const { data } = await axiosInstance.get<ServiceCenter[]>("/api/service-centers");
      return data;
    });
    return result;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Fetch a specific service center by ID
 * @param centerId - The ID of the service center
 * @returns Promise<ServiceCenter>
 */
export async function getServiceCenterById(centerId: number): Promise<ServiceCenter> {
  try {
    const result = await retryWithBackoff(async () => {
      const { data } = await axiosInstance.get<ServiceCenter>(
        `/api/service-centers/${centerId}`
      );
      return data;
    });
    return result;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Fetch only available service centers
 * @returns Promise<ServiceCenter[]>
 */
export async function getAvailableServiceCenters(): Promise<ServiceCenter[]> {
  try {
    const centers = await getAllServiceCenters();
    return centers.filter(center => center.isAvailable && center.isActive);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Check if a service center is currently available
 * @param centerId - The ID of the service center
 * @returns Promise<boolean>
 */
export async function checkServiceCenterAvailability(centerId: number): Promise<boolean> {
  try {
    const center = await getServiceCenterById(centerId);
    return center.isAvailable && center.isActive;
  } catch (error) {
    console.error("Error checking availability:", error);
    return false;
  }
}
