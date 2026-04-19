import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import type { ApiError } from "../types/auth";
import { supabase } from "../lib/supabaseClient";
import { requireSessionUser } from "../lib/authSession";
import { shouldUseSupabaseFallback } from "./fallbackUtils";

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
            const response = await axiosInstance.get(`/api/token/my-tokens`);
            // Unwrap API envelope { data: [...] } — same pattern as appointmentApi
            return response.data?.data ?? response.data;
        } catch (error) {
            if (!shouldUseSupabaseFallback(error)) {
                throw new Error(extractErrorMessage(error));
            }

            const session = requireSessionUser();
            const { data: tokens, error: tokenError } = await supabase
                .from("tokens")
                .select("token_id, center_id, token_number, issued_date, status, issued_time, served_time, completed_time, cancelled_at, queue_position")
                .eq("user_id", session.userId)
                .order("token_id", { ascending: false });

            if (tokenError) {
                throw new Error(tokenError.message);
            }

            const centerIds = [...new Set((tokens ?? []).map((item: any) => item.center_id))];
            let centerNameById = new Map<number, string>();

            if (centerIds.length > 0) {
                const { data: centers, error: centerError } = await supabase
                    .from("service_centers")
                    .select("center_id, name")
                    .in("center_id", centerIds);

                if (!centerError) {
                    centerNameById = new Map((centers ?? []).map((item: any) => [item.center_id, item.name]));
                }
            }

            return (tokens ?? []).map((item: any) => ({
                tokenId: item.token_id,
                centerId: item.center_id,
                centerName: centerNameById.get(item.center_id) ?? `Center ${item.center_id}`,
                tokenNumber: item.token_number,
                issuedDate: item.issued_date,
                status: item.status,
                issuedTime: item.issued_time,
                estimatedServiceTime: null,
                servedTime: item.served_time,
                completedTime: item.completed_time,
                cancelledAt: item.cancelled_at,
                queuePosition: item.queue_position,
                eta: null,
            }));
        }
    },

    getServiceCenterQueue: async (centerId: number): Promise<QueuePositionDto[]> => {
        try {
            const response = await axiosInstance.get(`/api/token/center/${centerId}/queue`);
            // Unwrap API envelope { data: [...] }
            return response.data?.data ?? response.data;
        } catch (error) {
            if (shouldUseSupabaseFallback(error)) {
                const { data, error: dbError } = await supabase
                    .from("tokens")
                    .select("token_id, token_number, status, queue_position")
                    .eq("center_id", centerId)
                    .eq("issued_date", new Date().toISOString().slice(0, 10))
                    .in("status", ["Waiting", "Called"])
                    .order("queue_position", { ascending: true })
                    .order("token_id", { ascending: true });

                if (dbError) {
                    throw new Error(dbError.message);
                }

                return (data ?? []).map((token: any, index: number) => ({
                    tokenId: token.token_id,
                    tokenNumber: token.token_number,
                    status: token.status,
                    position: token.queue_position ?? index + 1,
                    eta: null,
                }));
            }

            // Fallback for environments where center queue endpoint is not exposed.
            // We derive a minimal queue view from the caller's active tokens.
            if (error instanceof AxiosError && error.response?.status === 404) {
                const response = await axiosInstance.get(`/api/token/my-tokens`);
                const myTokens = (response.data?.data ?? response.data ?? []) as UserToken[];

                return myTokens
                    .filter((token) =>
                        token.centerId === centerId
                        && ["waiting", "called", "serving"].includes(String(token.status).toLowerCase())
                    )
                    .sort((a, b) => (a.queuePosition ?? Number.MAX_SAFE_INTEGER) - (b.queuePosition ?? Number.MAX_SAFE_INTEGER))
                    .map((token) => ({
                        tokenId: token.tokenId,
                        tokenNumber: token.tokenNumber,
                        status: token.status,
                        position: token.queuePosition ?? 0,
                        eta: token.eta,
                    }));
            }

            throw new Error(extractErrorMessage(error));
        }
    },

    cancelToken: async (tokenId: number): Promise<void> => {
        try {
            await axiosInstance.put(`/api/token/${tokenId}/cancel`);
        } catch (error) {
            if (shouldUseSupabaseFallback(error)) {
                const session = requireSessionUser();
                const { data: token, error: tokenError } = await supabase
                    .from("tokens")
                    .select("token_id, user_id, status")
                    .eq("token_id", tokenId)
                    .maybeSingle();

                if (tokenError) {
                    throw new CancelTokenError("UNKNOWN_ERROR", tokenError.message);
                }

                if (!token || token.user_id !== session.userId) {
                    throw new CancelTokenError("TOKEN_NOT_FOUND", "Token not found.");
                }

                const currentStatus = String(token.status).toLowerCase();
                if (currentStatus === "cancelled") {
                    throw new CancelTokenError("TOKEN_ALREADY_CANCELLED", "Token is already cancelled.");
                }

                if (currentStatus !== "waiting") {
                    throw new CancelTokenError("TOKEN_NOT_CANCELLABLE", "Token cannot be cancelled in the current state.");
                }

                const nowIso = new Date().toISOString();
                const { error: updateError } = await supabase
                    .from("tokens")
                    .update({
                        status: "Cancelled",
                        cancelled_at: nowIso,
                        updated_at: nowIso,
                    })
                    .eq("token_id", tokenId);

                if (updateError) {
                    throw new CancelTokenError("UNKNOWN_ERROR", updateError.message);
                }

                return;
            }

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
