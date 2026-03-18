// frontend/src/api/counterApi.ts

import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";

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
    | "INVALID_TOKEN_STATE"
    | "TOKEN_COUNTER_MISMATCH"
    | "TARGET_COUNTER_CLOSED"
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
    queuePosition: number | null;
    issuedTime: string;
    status: string;
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

export const counterApi = {
    async callNext(counterId: number): Promise<CalledTokenDto> {
        try {
            const response = await axiosInstance.post(`/api/counters/${counterId}/call-next`);
            return response.data?.data ?? response.data;
        } catch (error) {
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
            throw new Error(extractErrorMessage(error));
        }
    },

    async getAvailableCounters(centerId: number): Promise<AvailableCounterDto[]> {
        try {
            const response = await axiosInstance.get(`/api/service-centers/${centerId}/counters`);
            const counters = (response.data?.data ?? response.data) as AvailableCounterDto[];
            return counters;
        } catch (error) {
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
            if (error instanceof AxiosError) {
                const statusCode = error.response?.status;
                const data = error.response?.data as { code?: string; message?: string } | undefined;
                const message = data?.message ?? "An unexpected error occurred.";
                const code = data?.code;

                if (statusCode === 401 || statusCode === 403) {
                    if (code === "TOKEN_COUNTER_MISMATCH") {
                        throw new ReassignTokenError("TOKEN_COUNTER_MISMATCH", message);
                    }

                    throw new ReassignTokenError("AUTH_ERROR", "Your session has expired. Please sign in again.");
                }

                if (statusCode === 404 || code === "TOKEN_NOT_FOUND" || code === "RESOURCE_NOT_FOUND") {
                    throw new ReassignTokenError("TOKEN_NOT_FOUND", message);
                }

                if (statusCode === 400) {
                    if (message.toLowerCase().includes("closed")) {
                        throw new ReassignTokenError("TARGET_COUNTER_CLOSED", message);
                    }

                    throw new ReassignTokenError("INVALID_TOKEN_STATE", message);
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
