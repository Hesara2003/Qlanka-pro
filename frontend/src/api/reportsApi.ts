import { AxiosError, type AxiosResponse } from "axios";
import axiosInstance from "./axiosInstance";

export interface CustomReportPreviewDto {
    fromDate: string;
    toDate: string;
    headers: string[];
    rows: string[][];
    totalRow?: string[];
}

async function extractErrorMessage(error: unknown): Promise<string> {
    if (error instanceof AxiosError && error.response?.data) {
        if (error.response.data instanceof Blob) {
            try {
                const text = await error.response.data.text();
                const parsed = JSON.parse(text) as { message?: string };
                if (parsed?.message) return parsed.message;
            } catch {
                // Ignore blob parse failure and fall back to generic message.
            }
            return "Failed to run report. Check parameters.";
        }
        return (error.response.data as { message?: string }).message ?? "An unexpected error occurred.";
    }
    return "Failed to connect to service. Please try again.";
}

export async function downloadDailyCenterSummaryCsv(
    centerId: number,
    fromDate: string,
    toDate: string
): Promise<void> {
    const params = {
        from: fromDate,
        to: toDate,
        format: "csv"
    };

    const routes = [
        `/api/reports/centers/${centerId}/summary`,
        `/reports/centers/${centerId}/summary`,
    ];

    try {
        let response: AxiosResponse<Blob> | null = null;

        for (let i = 0; i < routes.length; i++) {
            try {
                response = await axiosInstance.get(routes[i], {
                    params,
                    responseType: "blob"
                });
                break;
            } catch (error) {
                if (error instanceof AxiosError && error.response?.status === 404 && i < routes.length - 1) {
                    continue;
                }
                throw error;
            }
        }

        if (!response) {
            throw new Error("Failed to connect to service. Please try again.");
        }

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
        throw new Error(await extractErrorMessage(error));
    }
}

export async function getCustomReportPreview(
    fromDate: string,
    toDate: string,
    centerIds: number[] = [],
    metrics: string[] = []
): Promise<CustomReportPreviewDto> {
    const params = {
        fromDate,
        toDate,
        centerIds: centerIds.length > 0 ? centerIds.join(",") : undefined,
        metrics: metrics.length > 0 ? metrics.join(",") : undefined
    };

    const response = await axiosInstance.get<CustomReportPreviewDto>("/api/reports/custom/preview", { params });
    return response.data;
}

export async function downloadCustomReport(
    fromDate: string,
    toDate: string,
    options?: {
        centerIds?: number[];
        metrics?: string[];
        format?: "csv" | "pdf";
    }
): Promise<void> {
    const format = options?.format ?? "csv";
    const params = {
        fromDate,
        toDate,
        centerIds: options?.centerIds && options.centerIds.length > 0 ? options.centerIds.join(",") : undefined,
        metrics: options?.metrics && options.metrics.length > 0 ? options.metrics.join(",") : undefined,
        format
    };

    const response = await axiosInstance.get("/api/reports/custom", {
        params,
        responseType: "blob"
    });

    if (response.status === 204) {
        throw new Error("No data available for the selected filters.");
    }

    let filename = `QueueLanka_CustomReport_${fromDate}_${toDate}.${format}`;
    const disposition = response.headers["content-disposition"];
    if (disposition && disposition.indexOf("filename=") !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, "");
        }
    }

    const mimeType = format === "pdf" ? "application/pdf" : "text/csv";
    const blob = new Blob([response.data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
}
