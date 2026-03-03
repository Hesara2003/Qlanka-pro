import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import type { ApiError } from "../types/auth";

// ── Cancellation error codes ─────────────────────────────────────────────────
// Mirror the codes returned by the backend controller.
export type CancelErrorCode =
    | "TOKEN_NOT_FOUND"
    | "TOKEN_ALREADY_CANCELLED"
    | "TOKEN_NOT_CANCELLABLE"
    | "AUTH_ERROR"
    | "NETWORK_ERROR"
    | "UNKNOWN_ERROR";

/** Typed error thrown by `tokenApi.cancelToken`. Carries a `code` for scenario-specific UI. */
export class CancelTokenError extends Error {
    readonly code: CancelErrorCode;

    constructor(code: CancelErrorCode, message: string) {
        super(message);
        this.name = "CancelTokenError";
        this.code = code;
    }
}

function extractErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        // Server responded with an error status
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data as ApiError | { message?: string; error?: string } | undefined;
            if (data?.message) return data.message;
            if ((data as { error?: string })?.error) return (data as { error?: string }).error!;
            // Fallback to HTTP status text
            if (status === 401) return "Your session has expired. Please sign in again.";
            if (status === 403) return "You don't have permission to access this resource.";
            if (status === 404) return "Resource not found.";
            if (status >= 500) return "Server error. Please try again later.";
            return `Request failed (${status}).`;
        }
        // No response — true network/connectivity error
        return "Unable to reach the server. Please check your connection.";
    }
    return "An unexpected error occurred.";
}

// ── Interfaces ───────────────────────────────────────────────────────────────
export interface UserToken {
    tokenId: number;
    centerId: number;
    centerName: string;
    tokenNumber: string;
    issuedDate: string;
    status: string;
    issuedTime: string;
    estimatedServiceTime: string | null;
    servedTime: string | null;
    completedTime: string | null;
    cancelledAt: string | null;
    queuePosition: number | null;
    eta: string | null;
}

export interface QueuePositionDto {
    tokenId: number;
    tokenNumber: string;
    status: string;
    position: number;
    eta: string | null;
}

export const tokenApi = {
    getMyTokens: async (): Promise<UserToken[]> => {
        try {
            const response = await axiosInstance.get(`/api/Token/my-tokens`);
            // Unwrap API envelope { data: [...] } — same pattern as appointmentApi
            return response.data?.data ?? response.data;
        } catch (error) {
            throw new Error(extractErrorMessage(error));
        }
    },

    getServiceCenterQueue: async (centerId: number): Promise<QueuePositionDto[]> => {
        try {
            const response = await axiosInstance.get(`/api/Token/center/${centerId}/queue`);
            // Unwrap API envelope { data: [...] }
            return response.data?.data ?? response.data;
        } catch (error) {
            throw new Error(extractErrorMessage(error));
        }
    },

    cancelToken: async (tokenId: number): Promise<void> => {
        try {
            await axiosInstance.put(`/api/Token/${tokenId}/cancel`);
        } catch (error) {
            if (error instanceof AxiosError) {
                const status = error.response?.status;
                const data = error.response?.data as { code?: string; message?: string } | undefined;
                const msg = data?.message ?? "An unexpected error occurred.";
                const code = data?.code;

                // 401 / 403 — authentication / authorisation failure
                if (status === 401 || status === 403) {
                    throw new CancelTokenError("AUTH_ERROR", "Your session has expired. Please sign in again.");
                }

                // 404 — token not found or doesn't belong to the user
                if (status === 404 || code === "TOKEN_NOT_FOUND") {
                    throw new CancelTokenError("TOKEN_NOT_FOUND", msg);
                }

                // 409 Conflict — token is already cancelled
                if (status === 409 || code === "TOKEN_ALREADY_CANCELLED") {
                    throw new CancelTokenError("TOKEN_ALREADY_CANCELLED", msg);
                }

                // 422 Unprocessable — token is being served / completed / no-show
                if (status === 422 || code === "TOKEN_NOT_CANCELLABLE") {
                    throw new CancelTokenError("TOKEN_NOT_CANCELLABLE", msg);
                }

                // Network-level error (no response from server)
                if (!error.response) {
                    throw new CancelTokenError("NETWORK_ERROR", "Couldn't reach the server. Please check your connection and try again.");
                }
            }
            // Fallback
            throw new CancelTokenError("UNKNOWN_ERROR", extractErrorMessage(error));
        }
    },
};
