// frontend/src/api/counterManagementApi.ts

import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import type {
  CreateCounterApiResponse,
  CreateCounterRequest,
  Counter,
  GetCounterByIdApiResponse,
  GetCountersApiResponse,
  ListCountersResponse,
  UpdateCounterStatusApiResponse,
  UpdateCounterStatusRequest,
} from "../types/counter";

interface ApiErrorBody {
  code?: string;
  message?: string;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiErrorBody;
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

export async function createCounter(
  centerId: number,
  request: CreateCounterRequest
): Promise<Counter> {
  try {
    const { data } = await axiosInstance.post<CreateCounterApiResponse>(
      `/api/admin/centers/${centerId}/counters`,
      request
    );

    return data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function getCounters(centerId: number): Promise<ListCountersResponse> {
  try {
    const { data } = await axiosInstance.get<GetCountersApiResponse>(
      `/api/admin/centers/${centerId}/counters`
    );

    return data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function getCounterById(
  centerId: number,
  counterId: number
): Promise<Counter> {
  try {
    const { data } = await axiosInstance.get<GetCounterByIdApiResponse>(
      `/api/admin/centers/${centerId}/counters/${counterId}`
    );

    return data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function updateCounterStatus(
  centerId: number,
  counterId: number,
  request: UpdateCounterStatusRequest
): Promise<Counter> {
  try {
    const { data } = await axiosInstance.patch<UpdateCounterStatusApiResponse>(
      `/api/admin/centers/${centerId}/counters/${counterId}/status`,
      request
    );

    return data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
