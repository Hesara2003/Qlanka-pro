// QueueLanka.SmokeTests/tests/report-csv-validation.smoke.test.ts

import { expect, test, APIRequestContext } from "@playwright/test";
import { getAuthToken } from "../helpers/auth.helper";
import {
  getCsvHeaders,
  getCsvSummaryRow,
  parseCsvResponse,
} from "../helpers/csv.helper";

const EXPECTED_HEADERS = [
  "Date",
  "Center ID",
  "Center Name",
  "Tokens Issued",
  "Served",
  "Skipped",
  "Cancelled",
  "No Shows",
  "Avg Wait Time (min)",
  "Avg Service Time (min)",
  "Peak Hour",
  "Peak Hour Tokens",
  "Active Counters",
];

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

test.describe("Report CSV Validation Smoke Tests", () => {
  test("GET /api/reports/daily-summary/csv returns valid CSV for admin", async ({
    request,
  }) => {
    const adminToken = await getAdminAuthToken(request);
    const today = new Date().toISOString().slice(0, 10);
    const centerId = env.SMOKE_REPORT_CENTER_ID ?? "1";

    const response = await request.get(
      `/api/reports/daily-summary/csv?fromDate=${today}&toDate=${today}&centerIds=${centerId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"] ?? "";
    expect(contentType.toLowerCase()).toContain("text/csv");

    const contentDisposition = response.headers()["content-disposition"] ?? "";
    expect(contentDisposition.toLowerCase()).toContain("attachment");
    expect(contentDisposition).toMatch(
      /QueueLanka_DailySummary_\d{8}_\d{8}\.csv/i
    );

    const body = await response.text();
    const headers = getCsvHeaders(body);
    expect(headers).toEqual(EXPECTED_HEADERS);

    const rows = parseCsvResponse(body);
    expect(rows.length).toBeGreaterThan(0);

    const summaryRow = getCsvSummaryRow(rows);
    expect(summaryRow).toBeDefined();

    if (!summaryRow) {
      throw new Error("Summary row not found");
    }

    const dataRows = rows.slice(0, -1);
    expect(dataRows.length).toBeGreaterThan(0);

    const firstDataRow = dataRows[0];
    const totalIssued = Number(firstDataRow["Tokens Issued"]);
    const served = Number(firstDataRow["Served"]);
    const skipped = Number(firstDataRow["Skipped"]);
    const cancelled = Number(firstDataRow["Cancelled"]);
    expect(totalIssued).toBeGreaterThanOrEqual(served + skipped + cancelled);

    const avgWait = Number(firstDataRow["Avg Wait Time (min)"]);
    expect(Number.isFinite(avgWait)).toBeTruthy();
    expect(avgWait).toBeGreaterThanOrEqual(0);

    expect(firstDataRow["Peak Hour"]).toMatch(/^([01]\d|2[0-3]):00$/);

    expect(summaryRow["Date"]).toBe("Total");
    expect(Number.isFinite(Number(summaryRow["Tokens Issued"]))).toBeTruthy();
    expect(Number.isFinite(Number(summaryRow["Served"]))).toBeTruthy();
    expect(Number.isFinite(Number(summaryRow["Skipped"]))).toBeTruthy();
    expect(Number.isFinite(Number(summaryRow["Cancelled"]))).toBeTruthy();
  });

  test("GET /api/reports/daily-summary/csv returns 403 for non-admin", async ({
    request,
  }) => {
    const nonAdminToken = await getAuthToken(request);
    const today = new Date().toISOString().slice(0, 10);

    const response = await request.get(
      `/api/reports/daily-summary/csv?fromDate=${today}&toDate=${today}&centerIds=1`,
      {
        headers: { Authorization: `Bearer ${nonAdminToken}` },
      }
    );

    expect(response.status()).toBe(403);
  });
});

async function getAdminAuthToken(request: APIRequestContext): Promise<string> {
  const username = env.SMOKE_ADMIN_USERNAME ?? "healthcheck_admin";
  const password = env.SMOKE_ADMIN_PASSWORD ?? "Health@Check1";

  const response = await request.post("/api/auth/login", {
    data: { username, password },
  });

  if (!response.ok()) {
    throw new Error(
      `Admin login failed (${response.status()}). Set SMOKE_ADMIN_USERNAME and SMOKE_ADMIN_PASSWORD for your environment.`
    );
  }

  const body = await response.json();
  return body.token;
}
