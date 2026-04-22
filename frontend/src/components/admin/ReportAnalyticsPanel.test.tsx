import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import ReportAnalyticsPanel from "./ReportAnalyticsPanel";
import * as serviceCenterApi from "../../api/serviceCenterApi";
import * as reportsApi from "../../api/reportsApi";

describe("ReportAnalyticsPanel (Local Execution)", () => {
  const mockCenters = [
    { centerId: 1, name: "Colombo Branch" },
    { centerId: 2, name: "Kandy Branch" }
  ];

  const mockAnalytics: reportsApi.DashboardAnalyticsDto = {
    fromDate: "2026-04-19",
    toDate: "2026-04-20",
    totalBookings: 150,
    totalServed: 100,
    totalSkipped: 10,
    averageWaitTimeSeconds: 600,
    peakHour: 10,
    peakHourTokenCount: 50,
    dailyBookings: [
      { date: "2026-04-19", bookings: 75 },
      { date: "2026-04-20", bookings: 75 }
    ]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(serviceCenterApi, "getAllServiceCenters").mockResolvedValue(mockCenters as any);
    vi.spyOn(reportsApi, "getDashboardAnalytics").mockResolvedValue(mockAnalytics);
  });

  afterEach(() => {
    cleanup();
  });

  test("renders the UI and loads initial data successfully", async () => {
    render(<ReportAnalyticsPanel />);
    
    // Check loading state
    expect(screen.getAllByText(/Loading chart/i).length).toBeGreaterThan(0);
    
    // Check successful render after data load
    await waitFor(() => {
      expect(screen.getByText("150")).toBeInTheDocument(); // total bookings
      expect(screen.getByText("10.0 min")).toBeInTheDocument(); // averageWaitTimeSeconds (600/60)
    });

    // Check filter select exists
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  test("handles empty dataset scenarios gracefully", async () => {
    vi.spyOn(reportsApi, "getDashboardAnalytics").mockResolvedValue({
      fromDate: "2026-04-19",
      toDate: "2026-04-20",
      totalBookings: 0,
      totalServed: 0,
      totalSkipped: 0,
      averageWaitTimeSeconds: 0,
      peakHour: -1,
      peakHourTokenCount: 0,
      dailyBookings: []
    });

    render(<ReportAnalyticsPanel />);
    
    await waitFor(() => {
      // 0 Total, 0 Served, 0 Skipped, 0 bookings at peak etc.
      expect(screen.getAllByText("0").length).toBeGreaterThan(0); 
      expect(screen.getByText("-")).toBeInTheDocument(); // peakHour
    });
  });

  test("triggers CSV export correctly with filter combinations", async () => {
    // Mock the blob download
    const downloadSpy = vi
      .spyOn(reportsApi, "downloadCustomReport")
      .mockResolvedValue(new Blob(["test csv"], { type: "text/csv" }));
    global.URL.createObjectURL = vi.fn(() => "blob:test");
    global.URL.revokeObjectURL = vi.fn();

    render(<ReportAnalyticsPanel />);
    
    await waitFor(() => screen.getByText("150")); // wait for load
    
    // Select filter
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "1" } });

    // Wait for the refetch to complete so the button is re-enabled
    const exportCsvBtn = screen.getByRole("button", { name: /export csv/i });
    await waitFor(() => expect(exportCsvBtn).not.toBeDisabled());

    // Click Export CSV
    fireEvent.click(exportCsvBtn);

    // Verify it passes correct params reflecting filter state
    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(
        expect.any(String), // fromDate
        expect.any(String), // toDate
        expect.objectContaining({
          centerIds: [1],
          format: "csv"
        })
      );
    });
  });

  test("shows error state when data fetch fails", async () => {
    vi.spyOn(reportsApi, "getDashboardAnalytics").mockRejectedValue(new Error("Network Error"));
    
    render(<ReportAnalyticsPanel />);
    
    await waitFor(() => {
      expect(screen.getByText(/Network Error|Failed to load/i)).toBeInTheDocument();
    });
  });
});
