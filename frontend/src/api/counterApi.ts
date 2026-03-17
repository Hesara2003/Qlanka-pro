// frontend/src/api/counterApi.ts

import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import type { ApiError } from "../types/auth";

// ── Typed error codes ──────────────────────────────────────────────────────────
export type CallNextErrorCode =
    | "NO_WAITING_TOKENS"
    | "COUNTER_CLOSED"
    | "AUTH_ERROR"
    | "NETWORK_ERROR"
    | "UNKNOWN_ERROR";

/** Typed error thrown by `counterApi.callNext`. Carries a `code` for scenario-specific UI. */
export class CallNextError extends Error {
    readonly code: CallNextErrorCode;

    constructor(code: CallNextErrorCode, message: string) {
        super(message);
        this.name = "CallNextError";
        this.code = code;
    }
}

// ── Response shape ─────────────────────────────────────────────────────────────
export interface CalledTokenDto {
    tokenId: number;
    centerId: number;
    counterId: number;
    userId: number;
    tokenNumber: string;
    issuedDate: string;
    status: string;
    issuedTime: string;
    calledAt: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────
function extractErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data as ApiError | { message?: string } | undefined;
            if (data?.message) return data.message;
            if (status === 401) return "Your session has expired. Please sign in again.";
            if (status === 403) return "You don't have permission to access this resource.";
            if (status >= 500) return "Server error. Please try again later.";
            return `Request failed (${status}).`;
        }
        return "Unable to reach the server. Please check your connection.";
    }
    return "An unexpected error occurred.";
}

// ── API object ────────────────────────────────────────────────────────────────
export const counterApi = {
    /**
     * Calls the next waiting token at the specified counter.
     * POST /api/counters/{counterId}/call-next
     */
    callNext: async (counterId: number): Promise<CalledTokenDto> => {
        try {
            const response = await axiosInstance.post(`/api/counters/${counterId}/call-next`);
            // Unwrap API envelope { data: {...} } — same pattern as tokenApi / appointmentApi
            return response.data?.data ?? response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                const status = error.response?.status;
                const data = error.response?.data as { code?: string; message?: string } | undefined;
                const msg = data?.message ?? "An unexpected error occurred.";
                const code = data?.code;

                // 401 / 403 — authentication / authorisation failure
                if (status === 401 || status === 403) {
                    throw new CallNextError("AUTH_ERROR", "Your session has expired. Please sign in again.");
                }

                // 404 — no waiting tokens for this counter today
                if (status === 404 || code === "NO_WAITING_TOKENS") {
                    throw new CallNextError("NO_WAITING_TOKENS", msg || "There are no waiting tokens for this counter right now.");
                }

                // 400 — counter is closed or does not exist
                if (status === 400 || code === "COUNTER_CLOSED") {
                    throw new CallNextError("COUNTER_CLOSED", msg || "This counter is currently closed.");
                }

                // Network-level error (no response from server)
                if (!error.response) {
                    throw new CallNextError("NETWORK_ERROR", "Couldn't reach the server. Please check your connection and try again.");
                }
            }
            // Fallback
            throw new CallNextError("UNKNOWN_ERROR", extractErrorMessage(error));
        }
    },
};
