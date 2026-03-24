import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";

function extractErrorMessage(error: unknown): string {
    if (error instanceof AxiosError && error.response?.data) {
        if (error.response.data instanceof Blob) {
            return "Failed to run report. Check parameters.";
        }
        return error.response.data.message ?? "An unexpected error occurred.";
    }
    return "Failed to connect to service. Please try again.";
}

export async function downloadDailyCenterSummaryCsv(
    centerId: number,
    fromDate: string,
    toDate: string
): Promise<void> {
    try {
        const response = await axiosInstance.get(`/api/reports/centers/${centerId}/summary`, {
            params: {
                from: fromDate,
                to: toDate,
                format: "csv"
            },
            responseType: 'blob' // Explicitly fetch as blob
        });

        // If backend returned 204 No Content
        if (response.status === 204) {
            throw new Error("No data available for the selected dates.");
        }

        // Get filename from Content-Disposition header if available
        let filename = `QueueLanka_DailySummary_${fromDate}_${toDate}.csv`;
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition.indexOf('filename=') !== -1) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        // Create blob link to download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        if (error instanceof Error && error.message === "No data available for the selected dates.") {
            throw error;
        }
        throw new Error(extractErrorMessage(error));
    }
}
