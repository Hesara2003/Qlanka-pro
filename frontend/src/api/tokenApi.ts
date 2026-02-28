import axiosInstance from "./axiosInstance";

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
        const response = await axiosInstance.get(`/Token/my-tokens`);
        return response.data;
    },
};
