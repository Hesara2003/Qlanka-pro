// frontend/src/api/counterApi.ts

import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import { supabase } from "../lib/supabaseClient";
import { requireSessionUser } from "../lib/authSession";
import { shouldUseSupabaseFallback } from "./fallbackUtils";

export type CallNextErrorCode =
    | "NO_WAITING_TOKENS"
    | "COUNTER_CLOSED"
    | "AUTH_ERROR"
    | "NETWORK_ERROR"
    | "UNKNOWN_ERROR";

export type UpdateTokenStatusErrorCode =
    | "TOKEN_NOT_FOUND"
    | "INVALID_STATUS"
    | "NOT_YOUR_TOKEN"
    | "AUTH_ERROR"
    | "NETWORK_ERROR"
    | "UNKNOWN_ERROR";

export type ReassignTokenErrorCode =
    | "TOKEN_NOT_FOUND"
    | "NOT_YOUR_TOKEN"
    | "TARGET_COUNTER_CLOSED"
    | "ALREADY_SERVED"
    | "AUTH_ERROR"
    | "NETWORK_ERROR"
    | "UNKNOWN_ERROR";

export class CallNextError extends Error {
    readonly code: CallNextErrorCode;

    constructor(code: CallNextErrorCode, message: string) {
        super(message);
        this.name = "CallNextError";
        this.code = code;
    }
}

export class UpdateTokenStatusError extends Error {
    readonly code: UpdateTokenStatusErrorCode;

    constructor(code: UpdateTokenStatusErrorCode, message: string) {
        super(message);
        this.name = "UpdateTokenStatusError";
        this.code = code;
    }
}

export class ReassignTokenError extends Error {
    readonly code: ReassignTokenErrorCode;

    constructor(code: ReassignTokenErrorCode, message: string) {
        super(message);
        this.name = "ReassignTokenError";
        this.code = code;
    }
}

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

export interface UpdateTokenStatusResponseDto {
    tokenId: number;
    centerId: number;
    counterId: number;
    userId: number | null;
    tokenNumber: string;
    issuedDate: string;
    issuedTime: string;
    calledAt: string | null;
    servedAt: string | null;
    status: string;
    nextTokenId: number | null;
}

export interface AvailableCounterDto {
    counterId: number;
    centerId: number;
    name: string;
    status: string;
}

export interface WaitingTokenDto {
    tokenId: number;
    tokenNumber: string;
    queuePosition: number;
    issuedAt: string;
    estimatedWaitSeconds: number;
    issuedTime?: string;
    status?: string;
}

export interface DashboardCurrentTokenDto {
    tokenId: number;
    tokenNumber: string;
    status: string;
    calledAt: string | null;
    waitedSeconds: number;
}

export interface CounterDashboardDto {
    counterId: number;
    counterName: string;
    isOpen: boolean;
    currentToken: DashboardCurrentTokenDto | null;
    waitingTokens: WaitingTokenDto[];
    servedCount: number;
    skippedCount: number;
    averageServiceTimeSeconds: number;
}

export interface CounterStatsDto {
    servedCount: number;
    skippedCount: number;
    averageServiceTimeSeconds: number;
}

export interface ReassignTokenResponseDto {
    tokenId: number;
    centerId: number;
    userId: number | null;
    tokenNumber: string;
    status: string;
    issuedDate: string;
    issuedTime: string;
    queuePosition: number | null;
    sourceCounterId: number;
    targetCounterId: number;
    reassignedAt: string;
}

function extractErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        if (!error.response) {
            return "Couldn't reach the server. Please check your connection and try again.";
        }

        const status = error.response.status;
        const data = error.response.data as { message?: string } | undefined;
        if (data?.message) return data.message;
        if (status >= 500) return "Server error. Please try again later.";
        return `Request failed (${status}).`;
    }

    return "An unexpected error occurred.";
}

function todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
}

async function getCounterRecord(counterId: number) {
    const { data, error } = await supabase
        .from("counters")
        .select("counter_id, center_id, name, status, current_token_id")
        .eq("counter_id", counterId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

function computeAverageServiceTimeSeconds(rows: Array<{ called_at: string | null; served_time: string | null }>): number {
    const values = rows
        .map((row) => {
            if (!row.called_at || !row.served_time) {
                return null;
            }

            const calledAt = new Date(row.called_at).getTime();
            const servedAt = new Date(row.served_time).getTime();

            if (Number.isNaN(calledAt) || Number.isNaN(servedAt) || servedAt < calledAt) {
                return null;
            }

            return Math.floor((servedAt - calledAt) / 1000);
        })
        .filter((value): value is number => value !== null);

    if (values.length === 0) {
        return 0;
    }

    return Math.floor(values.reduce((sum, value) => sum + value, 0) / values.length);
}

async function getStatsForCounter(counterId: number): Promise<CounterStatsDto | null> {
    const counter = await getCounterRecord(counterId);
    if (!counter) {
        return null;
    }

    const { data, error } = await supabase
        .from("tokens")
        .select("status, called_at, served_time")
        .eq("center_id", counter.center_id)
        .eq("issued_date", todayIsoDate());

    if (error) {
        throw new Error(error.message);
    }

    const rows = data ?? [];
    const servedCount = rows.filter((row: any) => String(row.status).toLowerCase() === "completed").length;
    const skippedCount = rows.filter((row: any) => String(row.status).toLowerCase() === "skipped").length;

    return {
        servedCount,
        skippedCount,
        averageServiceTimeSeconds: computeAverageServiceTimeSeconds(rows),
    };
}

export const counterApi = {
    async callNext(counterId: number): Promise<CalledTokenDto> {
        try {
            const response = await axiosInstance.post(`/api/counters/${counterId}/call-next`);
            return response.data?.data ?? response.data;
        } catch (error) {
            if (shouldUseSupabaseFallback(error)) {
                try {
                    const counter = await getCounterRecord(counterId);
                    if (!counter) {
                        throw new CallNextError("NO_WAITING_TOKENS", "Counter not found.");
                    }

                    if (String(counter.status).toLowerCase() !== "open") {
                        throw new CallNextError("COUNTER_CLOSED", "This counter is currently closed.");
                    }

                    const { data: waitingToken, error: waitingError } = await supabase
                        .from("tokens")
                        .select("token_id, center_id, user_id, token_number, issued_date, issued_time")
                        .eq("center_id", counter.center_id)
                        .eq("issued_date", todayIsoDate())
                        .eq("status", "Waiting")
                        .order("queue_position", { ascending: true })
                        .order("token_id", { ascending: true })
                        .limit(1)
                        .maybeSingle();

                    if (waitingError) {
                        throw new CallNextError("UNKNOWN_ERROR", waitingError.message);
                    }

                    if (!waitingToken) {
                        throw new CallNextError("NO_WAITING_TOKENS", "No waiting tokens are available.");
                    }

                    const nowIso = new Date().toISOString();

                    const { error: updateTokenError } = await supabase
                        .from("tokens")
                        .update({
                            status: "Called",
                            called_at: nowIso,
                            updated_at: nowIso,
                            counter_id: counterId,
                        })
                        .eq("token_id", waitingToken.token_id);

                    if (updateTokenError) {
                        throw new CallNextError("UNKNOWN_ERROR", updateTokenError.message);
                    }

                    const { error: updateCounterError } = await supabase
                        .from("counters")
                        .update({
                            current_token_id: waitingToken.token_id,
                            updated_at: nowIso,
                        })
                        .eq("counter_id", counterId);

                    if (updateCounterError) {
                        throw new CallNextError("UNKNOWN_ERROR", updateCounterError.message);
                    }

                    return {
                        tokenId: waitingToken.token_id,
                        centerId: waitingToken.center_id,
                        counterId,
                        userId: waitingToken.user_id,
                        tokenNumber: waitingToken.token_number,
                        issuedDate: waitingToken.issued_date,
                        status: "Called",
                        issuedTime: waitingToken.issued_time,
                        calledAt: nowIso,
                    };
                } catch (fallbackError) {
                    if (fallbackError instanceof CallNextError) {
                        throw fallbackError;
                    }

                    throw new CallNextError("UNKNOWN_ERROR", extractErrorMessage(fallbackError));
                }
            }

            if (error instanceof AxiosError) {
                const status = error.response?.status;
                const data = error.response?.data as { code?: string; message?: string } | undefined;
                const message = data?.message ?? "An unexpected error occurred.";

                if (status === 401 || status === 403) {
                    throw new CallNextError("AUTH_ERROR", "Your session has expired. Please sign in again.");
                }

                if (status === 404 || data?.code === "NO_WAITING_TOKENS") {
                    throw new CallNextError("NO_WAITING_TOKENS", message || "No waiting tokens are available.");
                }

                if (status === 400 || data?.code === "COUNTER_CLOSED") {
                    throw new CallNextError("COUNTER_CLOSED", message || "This counter is currently closed.");
                }

                if (!error.response) {
                    throw new CallNextError("NETWORK_ERROR", "Couldn't reach the server. Please check your connection and try again.");
                }
            }

            throw new CallNextError("UNKNOWN_ERROR", extractErrorMessage(error));
        }
    },

    async updateTokenStatus(
        counterId: number,
        tokenId: number,
        status: "served" | "skipped",
    ): Promise<UpdateTokenStatusResponseDto> {
        try {
            const response = await axiosInstance.put(`/api/counters/${counterId}/tokens/${tokenId}/status`, { status });
            return response.data?.data ?? response.data;
        } catch (error) {
            if (shouldUseSupabaseFallback(error)) {
                try {
                    const session = requireSessionUser();
                    const { data: token, error: tokenError } = await supabase
                        .from("tokens")
                        .select("token_id, center_id, user_id, token_number, issued_date, issued_time, called_at, status, counter_id")
                        .eq("token_id", tokenId)
                        .maybeSingle();

                    if (tokenError) {
                        throw new UpdateTokenStatusError("UNKNOWN_ERROR", tokenError.message);
                    }

                    if (!token) {
                        throw new UpdateTokenStatusError("TOKEN_NOT_FOUND", "Token not found.");
                    }

                    if (token.counter_id !== counterId) {
                        throw new UpdateTokenStatusError("NOT_YOUR_TOKEN", "This token does not belong to your counter.");
                    }

                    if (String(token.status).toLowerCase() !== "called") {
                        throw new UpdateTokenStatusError("INVALID_STATUS", "Token is not in called state.");
                    }

                    if (session.role === "officer") {
                        const { data: officerCounter } = await supabase
                            .from("counters")
                            .select("counter_id")
                            .eq("counter_id", counterId)
                            .eq("officer_user_id", session.userId)
                            .maybeSingle();

                        if (!officerCounter) {
                            throw new UpdateTokenStatusError("NOT_YOUR_TOKEN", "This token does not belong to your counter.");
                        }
                    }

                    const nowIso = new Date().toISOString();
                    const finalStatus = status === "served" ? "Completed" : "Skipped";

                    const { error: updateError } = await supabase
                        .from("tokens")
                        .update({
                            status: finalStatus,
                            served_time: status === "served" ? nowIso : null,
                            updated_at: nowIso,
                        })
                        .eq("token_id", tokenId);

                    if (updateError) {
                        throw new UpdateTokenStatusError("UNKNOWN_ERROR", updateError.message);
                    }

                    const { error: clearCounterError } = await supabase
                        .from("counters")
                        .update({
                            current_token_id: null,
                            updated_at: nowIso,
                        })
                        .eq("counter_id", counterId);

                    if (clearCounterError) {
                        throw new UpdateTokenStatusError("UNKNOWN_ERROR", clearCounterError.message);
                    }

                    const { data: nextToken } = await supabase
                        .from("tokens")
                        .select("token_id")
                        .eq("center_id", token.center_id)
                        .eq("issued_date", todayIsoDate())
                        .eq("status", "Waiting")
                        .order("queue_position", { ascending: true })
                        .order("token_id", { ascending: true })
                        .limit(1)
                        .maybeSingle();

                    return {
                        tokenId: token.token_id,
                        centerId: token.center_id,
                        counterId,
                        userId: token.user_id,
                        tokenNumber: token.token_number,
                        issuedDate: token.issued_date,
                        issuedTime: token.issued_time,
                        calledAt: token.called_at,
                        servedAt: status === "served" ? nowIso : null,
                        status: finalStatus,
                        nextTokenId: nextToken?.token_id ?? null,
                    };
                } catch (fallbackError) {
                    if (fallbackError instanceof UpdateTokenStatusError) {
                        throw fallbackError;
                    }

                    throw new UpdateTokenStatusError("UNKNOWN_ERROR", extractErrorMessage(fallbackError));
                }
            }

            if (error instanceof AxiosError) {
                const statusCode = error.response?.status;
                const data = error.response?.data as { code?: string; message?: string } | undefined;
                const message = data?.message ?? "An unexpected error occurred.";
                const code = data?.code;

                if (statusCode === 401 || statusCode === 403) {
                    if (code === "TOKEN_COUNTER_MISMATCH") {
                        throw new UpdateTokenStatusError("NOT_YOUR_TOKEN", "This token does not belong to your counter.");
                    }

                    throw new UpdateTokenStatusError("AUTH_ERROR", "Your session has expired. Please sign in again.");
                }

                if (statusCode === 404 || code === "TOKEN_NOT_FOUND") {
                    throw new UpdateTokenStatusError("TOKEN_NOT_FOUND", message);
                }

                if (statusCode === 400 || code === "INVALID_STATUS" || code === "INVALID_TOKEN_STATE") {
                    throw new UpdateTokenStatusError("INVALID_STATUS", message);
                }

                if (!error.response) {
                    throw new UpdateTokenStatusError("NETWORK_ERROR", "Couldn't reach the server. Please check your connection and try again.");
                }

                throw new UpdateTokenStatusError("UNKNOWN_ERROR", message);
            }

            throw new UpdateTokenStatusError("UNKNOWN_ERROR", extractErrorMessage(error));
        }
    },

    async getWaitingTokens(counterId: number): Promise<WaitingTokenDto[]> {
        try {
            const response = await axiosInstance.get(`/api/counters/${counterId}/tokens/waiting`);
            return response.data?.data ?? response.data;
        } catch (error) {
            if (shouldUseSupabaseFallback(error)) {
                const counter = await getCounterRecord(counterId);
                if (!counter) {
                    throw new Error("Counter not found.");
                }

                const { data, error: dbError } = await supabase
                    .from("tokens")
                    .select("token_id, token_number, queue_position, issued_time, status")
                    .eq("center_id", counter.center_id)
                    .eq("issued_date", todayIsoDate())
                    .eq("status", "Waiting")
                    .order("queue_position", { ascending: true })
                    .order("token_id", { ascending: true });

                if (dbError) {
                    throw new Error(dbError.message);
                }

                return (data ?? []).map((item: any, index: number) => ({
                    tokenId: item.token_id,
                    tokenNumber: item.token_number,
                    queuePosition: item.queue_position ?? index + 1,
                    issuedAt: item.issued_time,
                    estimatedWaitSeconds: (item.queue_position ?? index + 1) * 300,
                    issuedTime: item.issued_time,
                    status: item.status,
                }));
            }

            throw new Error(extractErrorMessage(error));
        }
    },

    async getDashboard(counterId: number): Promise<CounterDashboardDto> {
        try {
            const response = await axiosInstance.get(`/api/counters/${counterId}/dashboard`);
            return response.data?.data ?? response.data;
        } catch (error) {
            if (shouldUseSupabaseFallback(error)) {
                const counter = await getCounterRecord(counterId);
                if (!counter) {
                    throw new Error("Counter not found.");
                }

                const stats = await getStatsForCounter(counterId);

                const { data: waitingData, error: waitingError } = await supabase
                    .from("tokens")
                    .select("token_id, token_number, queue_position, issued_time, status")
                    .eq("center_id", counter.center_id)
                    .eq("issued_date", todayIsoDate())
                    .eq("status", "Waiting")
                    .order("queue_position", { ascending: true })
                    .order("token_id", { ascending: true });

                if (waitingError) {
                    throw new Error(waitingError.message);
                }

                let currentToken: DashboardCurrentTokenDto | null = null;
                if (counter.current_token_id) {
                    const { data: current, error: currentError } = await supabase
                        .from("tokens")
                        .select("token_id, token_number, status, called_at")
                        .eq("token_id", counter.current_token_id)
                        .maybeSingle();

                    if (currentError) {
                        throw new Error(currentError.message);
                    }

                    if (current) {
                        const calledAtMs = current.called_at ? new Date(current.called_at).getTime() : null;
                        currentToken = {
                            tokenId: current.token_id,
                            tokenNumber: current.token_number,
                            status: current.status,
                            calledAt: current.called_at,
                            waitedSeconds: calledAtMs ? Math.max(0, Math.floor((Date.now() - calledAtMs) / 1000)) : 0,
                        };
                    }
                }

                return {
                    counterId: counter.counter_id,
                    counterName: counter.name,
                    isOpen: String(counter.status).toLowerCase() === "open",
                    currentToken,
                    waitingTokens: (waitingData ?? []).map((item: any, index: number) => ({
                        tokenId: item.token_id,
                        tokenNumber: item.token_number,
                        queuePosition: item.queue_position ?? index + 1,
                        issuedAt: item.issued_time,
                        estimatedWaitSeconds: (item.queue_position ?? index + 1) * 300,
                        issuedTime: item.issued_time,
                        status: item.status,
                    })),
                    servedCount: stats?.servedCount ?? 0,
                    skippedCount: stats?.skippedCount ?? 0,
                    averageServiceTimeSeconds: stats?.averageServiceTimeSeconds ?? 0,
                };
            }

            throw new Error(extractErrorMessage(error));
        }
    },

    async getStats(counterId: number): Promise<CounterStatsDto> {
        try {
            const response = await axiosInstance.get(`/api/counters/${counterId}/stats`);
            return response.data?.data ?? response.data;
        } catch (error) {
            if (shouldUseSupabaseFallback(error)) {
                const stats = await getStatsForCounter(counterId);
                if (!stats) {
                    throw new Error("Counter not found.");
                }
                return stats;
            }

            throw new Error(extractErrorMessage(error));
        }
    },

    async getAvailableCounters(centerId: number): Promise<AvailableCounterDto[]> {
        try {
            const response = await axiosInstance.get(`/api/admin/centers/${centerId}/counters`);
            const payload = response.data?.data ?? response.data;
            const counters = Array.isArray(payload?.counters)
                ? payload.counters
                : (Array.isArray(payload) ? payload : []);

            return counters.map((counter: {
                counterId: number;
                centerId: number;
                name: string;
                isOpen?: boolean;
                status?: string;
            }) => ({
                counterId: counter.counterId,
                centerId: counter.centerId,
                name: counter.name,
                status: typeof counter.status === "string"
                    ? counter.status
                    : (counter.isOpen ? "Open" : "Closed"),
            }));
        } catch (error) {
            if (shouldUseSupabaseFallback(error)) {
                const { data, error: dbError } = await supabase
                    .from("counters")
                    .select("counter_id, center_id, name, status")
                    .eq("center_id", centerId)
                    .order("counter_id", { ascending: true });

                if (dbError) {
                    throw new Error(dbError.message);
                }

                return (data ?? []).map((counter: any) => ({
                    counterId: counter.counter_id,
                    centerId: counter.center_id,
                    name: counter.name,
                    status: counter.status,
                }));
            }

            throw new Error(extractErrorMessage(error));
        }
    },

    async reassignToken(
        sourceCounterId: number,
        tokenId: number,
        targetCounterId: number,
        reason?: string,
    ): Promise<ReassignTokenResponseDto> {
        try {
            const response = await axiosInstance.post(
                `/api/counters/${sourceCounterId}/tokens/reassign`,
                { tokenId, targetCounterId, reason },
            );

            return response.data?.data ?? response.data;
        } catch (error) {
            if (shouldUseSupabaseFallback(error)) {
                try {
                    const session = requireSessionUser();

                    if (session.role === "officer") {
                        const { data: ownerCounter } = await supabase
                            .from("counters")
                            .select("counter_id")
                            .eq("counter_id", sourceCounterId)
                            .eq("officer_user_id", session.userId)
                            .maybeSingle();

                        if (!ownerCounter) {
                            throw new ReassignTokenError("NOT_YOUR_TOKEN", "This token does not belong to your counter.");
                        }
                    }

                    const { data: token, error: tokenError } = await supabase
                        .from("tokens")
                        .select("token_id, center_id, user_id, token_number, status, issued_date, issued_time, queue_position, counter_id")
                        .eq("token_id", tokenId)
                        .maybeSingle();

                    if (tokenError) {
                        throw new ReassignTokenError("UNKNOWN_ERROR", tokenError.message);
                    }

                    if (!token) {
                        throw new ReassignTokenError("TOKEN_NOT_FOUND", "Token not found.");
                    }

                    if (token.counter_id !== sourceCounterId) {
                        throw new ReassignTokenError("NOT_YOUR_TOKEN", "This token does not belong to your counter.");
                    }

                    if (["completed", "skipped", "cancelled"].includes(String(token.status).toLowerCase())) {
                        throw new ReassignTokenError("ALREADY_SERVED", "This token cannot be reassigned anymore.");
                    }

                    const { data: targetCounter, error: targetError } = await supabase
                        .from("counters")
                        .select("counter_id, status")
                        .eq("counter_id", targetCounterId)
                        .maybeSingle();

                    if (targetError) {
                        throw new ReassignTokenError("UNKNOWN_ERROR", targetError.message);
                    }

                    if (!targetCounter || String(targetCounter.status).toLowerCase() !== "open") {
                        throw new ReassignTokenError("TARGET_COUNTER_CLOSED", "Target counter is closed.");
                    }

                    const nowIso = new Date().toISOString();
                    const { error: reassignError } = await supabase
                        .from("tokens")
                        .update({
                            counter_id: targetCounterId,
                            updated_at: nowIso,
                        })
                        .eq("token_id", tokenId);

                    if (reassignError) {
                        throw new ReassignTokenError("UNKNOWN_ERROR", reassignError.message);
                    }

                    return {
                        tokenId: token.token_id,
                        centerId: token.center_id,
                        userId: token.user_id,
                        tokenNumber: token.token_number,
                        status: token.status,
                        issuedDate: token.issued_date,
                        issuedTime: token.issued_time,
                        queuePosition: token.queue_position,
                        sourceCounterId,
                        targetCounterId,
                        reassignedAt: nowIso,
                    };
                } catch (fallbackError) {
                    if (fallbackError instanceof ReassignTokenError) {
                        throw fallbackError;
                    }

                    throw new ReassignTokenError("UNKNOWN_ERROR", extractErrorMessage(fallbackError));
                }
            }

            if (error instanceof AxiosError) {
                const statusCode = error.response?.status;
                const data = error.response?.data as { code?: string; message?: string } | undefined;
                const message = data?.message ?? "An unexpected error occurred.";
                const code = data?.code;
                const loweredMessage = message.toLowerCase();

                if (statusCode === 401) {
                    throw new ReassignTokenError("AUTH_ERROR", "Your session has expired. Please sign in again.");
                }

                if (statusCode === 403 || code === "TOKEN_COUNTER_MISMATCH") {
                    throw new ReassignTokenError("NOT_YOUR_TOKEN", "This token does not belong to your counter.");
                }

                if (statusCode === 404 || code === "TOKEN_NOT_FOUND" || code === "RESOURCE_NOT_FOUND") {
                    throw new ReassignTokenError("TOKEN_NOT_FOUND", message);
                }

                if (statusCode === 400) {
                    if (loweredMessage.includes("closed")) {
                        throw new ReassignTokenError("TARGET_COUNTER_CLOSED", message);
                    }

                    if (
                        loweredMessage.includes("served")
                        || loweredMessage.includes("skipped")
                        || loweredMessage.includes("cannot be reassigned")
                    ) {
                        throw new ReassignTokenError("ALREADY_SERVED", message);
                    }

                    throw new ReassignTokenError("UNKNOWN_ERROR", message);
                }

                if (!error.response) {
                    throw new ReassignTokenError("NETWORK_ERROR", "Couldn't reach the server. Please check your connection and try again.");
                }

                throw new ReassignTokenError("UNKNOWN_ERROR", message);
            }

            throw new ReassignTokenError("UNKNOWN_ERROR", extractErrorMessage(error));
        }
    },
};
