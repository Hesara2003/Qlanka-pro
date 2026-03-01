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
    if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as ApiError | { message?: string; error?: string };
        return data.message ?? (data as { error?: string }).error ?? "An unexpected error occurred.";
    }
    return "Network error. Please try again.";
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

export const tokenApi = {
    getMyTokens: async (): Promise<UserToken[]> => {
        try {
            const response = await axiosInstance.get(`/Token/my-tokens`);
            return response.data;
        } catch (error) {
            throw new Error(extractErrorMessage(error));
        }
    },

    cancelToken: async (tokenId: number): Promise<void> => {
        try {
            await axiosInstance.put(`/Token/${tokenId}/cancel`);
        } catch (error) {
            if (error instanceof AxiosError) {
                const status = error.response?.status;
                const data   = error.response?.data as { code?: string; message?: string } | undefined;
                const msg    = data?.message ?? "An unexpected error occurred.";
                const code   = data?.code;

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
