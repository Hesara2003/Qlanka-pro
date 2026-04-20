import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance";

export interface CustomReportQuery {
    fromDate: string;
    toDate: string;
    centerIds?: number[];
    statuses?: string[];
    metrics: string[];
    groupBy?: "date" | "center" | "date_center";
    page?: number;
    pageSize?: number;
}

export interface CustomReportRow {
    date?: string;
    centerId?: number;
    centerName?: string;
    metrics: Record<string, number>;
}

export interface CustomReportResponse {
    groupBy: string;
    metrics: string[];
    page: number;
    pageSize: number;
    totalGroups: number;
    rows: CustomReportRow[];
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface CenterSummaryCsvRow {
    date: string;
    centerId: number;
    centerName: string;
    tokensIssued: number;
    totalServed: number;
    totalSkipped: number;
    totalCancelled: number;
    noShowCount: number;
    avgWaitMinutes: number;
    avgServiceMinutes: number;
    peakHour: string;
    peakHourTokens: number;
    activeCounters: number;
}

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

export async function getCustomReport(query: CustomReportQuery): Promise<CustomReportResponse> {
    try {
        const params = {
            fromDate: query.fromDate,
            toDate: query.toDate,
            centerIds: query.centerIds && query.centerIds.length > 0 ? query.centerIds.join(",") : undefined,
            statuses: query.statuses && query.statuses.length > 0 ? query.statuses.join(",") : undefined,
            metrics: query.metrics.join(","),
            groupBy: query.groupBy ?? "date",
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 100,
        };

        const response = await axiosInstance.get<ApiResponse<CustomReportResponse>>("/api/reports/custom", {
            params,
        });

        return response.data.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}

export async function getCenterSummaryRows(
    centerId: number,
    fromDate: string,
    toDate: string
): Promise<CenterSummaryCsvRow[]> {
    try {
        const response = await axiosInstance.get<string>(`/api/reports/centers/${centerId}/summary`, {
            params: {
                from: fromDate,
                to: toDate,
                format: "csv"
            },
            responseType: "text",
        });

        if (!response.data || response.status === 204) {
            return [];
        }

        return parseCenterSummaryCsv(response.data);
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 204) {
            return [];
        }
        throw new Error(extractErrorMessage(error));
    }
}

function parseCenterSummaryCsv(rawCsv: string): CenterSummaryCsvRow[] {
    const csv = rawCsv.trimStart().replace(/^\uFEFF/, "");
    const lines = csv
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length <= 1) {
        return [];
    }

    const rows: CenterSummaryCsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.length < 13) {
            continue;
        }

        rows.push({
            date: values[0],
            centerId: parseInt(values[1] || "0", 10),
            centerName: values[2],
            tokensIssued: parseNumber(values[3]),
            totalServed: parseNumber(values[4]),
            totalSkipped: parseNumber(values[5]),
            totalCancelled: parseNumber(values[6]),
            noShowCount: parseNumber(values[7]),
            avgWaitMinutes: parseNumber(values[8]),
            avgServiceMinutes: parseNumber(values[9]),
            peakHour: values[10],
            peakHourTokens: parseNumber(values[11]),
            activeCounters: parseNumber(values[12]),
        });
    }

    return rows;
}

function parseNumber(value: string): number {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
                continue;
            }

            inQuotes = !inQuotes;
            continue;
        }

        if (ch === ',' && !inQuotes) {
            values.push(current);
            current = "";
            continue;
        }

        current += ch;
    }

    values.push(current);
    return values;
}
