import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import type { ServiceCenter } from "../types/serviceCenter";

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as { message?: string };
    return data.message ?? "An unexpected error occurred.";
  }
  return "Network error. Please try again.";
}

export async function getAllServiceCenters(): Promise<ServiceCenter[]> {
  try {
    const { data } = await axiosInstance.get<ServiceCenter[]>(
      "/api/service-centers"
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function getServiceCenterById(
  centerId: number
): Promise<ServiceCenter> {
  try {
    const { data } = await axiosInstance.get<ServiceCenter>(
      `/api/service-centers/${centerId}`
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
