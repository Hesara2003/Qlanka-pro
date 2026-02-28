import axios from "axios";

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

const API_BASE_URL = "http://localhost:5000/api"; // Should match actual configuration

export const tokenApi = {
    getMyTokens: async (): Promise<UserToken[]> => {
        // Assuming the token is automatically attached via an interceptor, as seen in auth apps usually
        // We will verify how the auth token is passed in a moment
        const token = localStorage.getItem("token"); // Fallback typical implementation
        const response = await axios.get(`${API_BASE_URL}/Token/my-tokens`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },
};
