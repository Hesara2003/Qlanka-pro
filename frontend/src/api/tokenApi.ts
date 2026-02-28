import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";
import type { ApiError } from "../types/auth"; // Reusing the ApiError type common across the app

function extractErrorMessage(error: unknown): string {
    if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as ApiError | { message?: string };
        // Sometimes the backend sends a raw message or a generic API Error
        return data.message ?? (data as ApiError).error ?? "An unexpected error occurred.";
    }
    return "Network error. Please try again.";
}

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
};
