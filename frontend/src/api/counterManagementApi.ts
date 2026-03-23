// frontend/src/api/counterManagementApi.ts

import { AxiosError } from "axios";
import axiosInstance, { AuthorizationError } from "./axiosInstance";
import type {
  CounterApiError,
  CreateCounterApiResponse,
  CreateCounterErrorCode,
  CreateCounterRequest,
  Counter,
  GetCounterByIdApiResponse,
  GetCountersApiResponse,
  ListCountersErrorCode,
  ListCountersResponse,
  StatusUpdateErrorCode,
  UpdateCounterStatusApiResponse,
  UpdateCounterStatusRequest,
} from "../types/counter";

interface ApiErrorBody {
  code?: string;
  message?: string;
}

function createCounterApiError<TCode extends string>(
  code: TCode,
  message: string
): Error & CounterApiError<TCode> {
  const error = new Error(message) as Error & CounterApiError<TCode>;
  error.code = code;
  return error;
}

function mapCreateCounterError(error: unknown): Error & CounterApiError<CreateCounterErrorCode> {
  if (error instanceof AuthorizationError) {
    return createCounterApiError("AUTH_ERROR", error.message);
  }

  if (error instanceof AxiosError) {
    if (!error.response) {
      return createCounterApiError(
        "NETWORK_ERROR",
        "Network error. Please check your connection and try again."
      );
    }

    const status = error.response.status;
    const data = (error.response.data ?? {}) as ApiErrorBody;
    const code = (data.code ?? "").toUpperCase();

    if (status === 401) {
      return createCounterApiError("AUTH_ERROR", "Your session has expired. Please log in again.");
    }

    if (status === 403) {
      return createCounterApiError("AUTH_ERROR", "You do not have permission to perform this action");
    }

    if (status === 409 || code === "DUPLICATE_NAME") {
      return createCounterApiError(
        "DUPLICATE_NAME",
        "A counter with this name already exists at this center"
      );
    }

    if (status === 404 || code === "CENTER_NOT_FOUND") {
      return createCounterApiError("CENTER_NOT_FOUND", "Selected center was not found.");
    }

    if (status === 400 || code === "INVALID_OFFICER") {
      return createCounterApiError("INVALID_OFFICER", "Assigned officer is invalid.");
    }

    return createCounterApiError(
      "NETWORK_ERROR",
      data.message ?? "Failed to create counter. Please try again."
    );
  }

  return createCounterApiError("NETWORK_ERROR", "Failed to connect to service. Please try again.");
}

function mapListCountersError(error: unknown): Error & CounterApiError<ListCountersErrorCode> {
  if (error instanceof AuthorizationError) {
    return createCounterApiError("AUTH_ERROR", error.message);
  }

  if (error instanceof AxiosError) {
    if (!error.response) {
      return createCounterApiError(
        "NETWORK_ERROR",
        "Network error. Please check your connection and try again."
      );
    }

    const status = error.response.status;
    const data = (error.response.data ?? {}) as ApiErrorBody;
    const code = (data.code ?? "").toUpperCase();

    if (status === 401) {
      return createCounterApiError("AUTH_ERROR", "Your session has expired. Please log in again.");
    }

    if (status === 403) {
      return createCounterApiError("AUTH_ERROR", "You do not have permission to perform this action");
    }

    if (status === 404 || code === "CENTER_NOT_FOUND") {
      return createCounterApiError("CENTER_NOT_FOUND", "Selected center was not found.");
    }

    return createCounterApiError(
      "NETWORK_ERROR",
      data.message ?? "Failed to load counters. Please try again."
    );
  }

  return createCounterApiError("NETWORK_ERROR", "Failed to connect to service. Please try again.");
}

function mapStatusUpdateError(error: unknown): Error & CounterApiError<StatusUpdateErrorCode> {
  if (error instanceof AuthorizationError) {
    return createCounterApiError("AUTH_ERROR", error.message);
  }

  if (error instanceof AxiosError) {
    if (!error.response) {
      console.error("Status Update error:", error);
      return createCounterApiError(
        "NETWORK_ERROR",
        `Network error: ${error.message}. Please check your connection and try again.`
      );
    }

    const status = error.response.status;
    const data = (error.response.data ?? {}) as ApiErrorBody;
    const code = (data.code ?? "").toUpperCase();

    if (status === 401) {
      return createCounterApiError("AUTH_ERROR", "Your session has expired. Please log in again.");
    }

    if (status === 403) {
      return createCounterApiError("AUTH_ERROR", "You do not have permission to perform this action");
    }

    if (status === 404 || code === "COUNTER_NOT_FOUND") {
      return createCounterApiError("COUNTER_NOT_FOUND", "Counter was not found.");
    }

    return createCounterApiError(
      "NETWORK_ERROR",
      data.message ?? "Failed to update counter status. Please try again."
    );
  }

  return createCounterApiError("NETWORK_ERROR", "Failed to connect to service. Please try again.");
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
    throw mapCreateCounterError(error);
  }
}

export async function getCounters(centerId: number): Promise<ListCountersResponse> {
  try {
    const { data } = await axiosInstance.get<GetCountersApiResponse>(
      `/api/admin/centers/${centerId}/counters`
    );

    return data.data;
  } catch (error) {
    throw mapListCountersError(error);
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
    throw mapListCountersError(error);
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
    throw mapStatusUpdateError(error);
  }
}
