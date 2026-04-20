import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAllServiceCenters } from "../api/serviceCenterApi";
import {
  getCenterSummaryRows,
  getCustomReport,
  type CustomReportResponse,
} from "../api/reportsApi";
import type { ServiceCenter } from "../types/serviceCenter";

interface DailyAnalyticsRow {
  date: string;
  bookings: number;
  served: number;
  skipped: number;
  avgWaitMinutes: number;
}

interface PeakHourRow {
  hour: string;
  count: number;
}

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);

  return {
    fromDate: formatDateInput(thirtyDaysAgo),
    toDate: formatDateInput(today),
  };
}

function mapDailyRows(report: CustomReportResponse): DailyAnalyticsRow[] {
  return report.rows
    .filter((row) => !!row.date)
    .map((row) => {
      const bookings = row.metrics.total_tokens_issued ?? 0;
      const served = row.metrics.total_served ?? 0;
      const skipped = row.metrics.total_skipped ?? 0;
      const avgWaitSeconds = row.metrics.avg_wait_time_seconds ?? 0;

      return {
        date: row.date!,
        bookings,
        served,
        skipped,
        avgWaitMinutes: Number((avgWaitSeconds / 60).toFixed(1)),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function AdminDashboardPage() {
  const defaults = useMemo(() => getDefaultDateRange(), []);

  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [centerFilter, setCenterFilter] = useState<string>("all");

  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [dailyRows, setDailyRows] = useState<DailyAnalyticsRow[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHourRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadMs, setLoadMs] = useState<number>(0);

  const selectedCenterId = centerFilter === "all" ? null : Number.parseInt(centerFilter, 10);

  useEffect(() => {
    let disposed = false;

    async function loadAnalytics() {
      const start = performance.now();
      setLoading(true);
      setError(null);

      try {
        const centerIds = selectedCenterId ? [selectedCenterId] : undefined;

        const [allCenters, customReport] = await Promise.all([
          getAllServiceCenters(),
          getCustomReport({
            fromDate,
            toDate,
            centerIds,
            metrics: [
              "total_tokens_issued",
              "total_served",
              "total_skipped",
              "avg_wait_time_seconds",
            ],
            groupBy: "date",
            page: 1,
            pageSize: 500,
          }),
        ]);

        if (disposed) {
          return;
        }

        setCenters(allCenters);
        setDailyRows(mapDailyRows(customReport));

        if (selectedCenterId) {
          const summaryRows = await getCenterSummaryRows(selectedCenterId, fromDate, toDate);

          if (disposed) {
            return;
          }

          const peakHourMap = new Map<string, number>();
          for (const row of summaryRows) {
            const key = row.peakHour;
            const current = peakHourMap.get(key) ?? 0;
            peakHourMap.set(key, current + row.peakHourTokens);
          }

          const peakList = Array.from(peakHourMap.entries())
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

          setPeakHours(peakList);
        } else {
          setPeakHours([]);
        }

        const elapsed = Math.round(performance.now() - start);
        setLoadMs(elapsed);
      } catch (err) {
        if (disposed) {
          return;
        }

        setDailyRows([]);
        setPeakHours([]);
        setError(err instanceof Error ? err.message : "Failed to load analytics.");
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      disposed = true;
    };
  }, [fromDate, toDate, selectedCenterId]);

  const totals = useMemo(() => {
    const totalBookings = dailyRows.reduce((sum, row) => sum + row.bookings, 0);
    const totalServed = dailyRows.reduce((sum, row) => sum + row.served, 0);
    const totalSkipped = dailyRows.reduce((sum, row) => sum + row.skipped, 0);

    const weightedWaitMinutes = dailyRows.reduce((sum, row) => sum + row.avgWaitMinutes * row.bookings, 0);
    const avgWait = totalBookings > 0 ? weightedWaitMinutes / totalBookings : 0;

    return {
      totalBookings,
      totalServed,
      totalSkipped,
      avgWaitMinutes: Number(avgWait.toFixed(1)),
    };
  }, [dailyRows]);

  const servedSkippedSummary = useMemo(
    () => [
      {
        label: "Overall",
        served: totals.totalServed,
        skipped: totals.totalSkipped,
      },
    ],
    [totals.totalServed, totals.totalSkipped]
  );

  return (
    <div className="px-8 py-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500">
            Report-backed trends for bookings, service outcomes, waiting time, and peak hours.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            From
            <input
              className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              max={toDate}
            />
          </label>

          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            To
            <input
              className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              min={fromDate}
            />
          </label>

          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Center
            <select
              className="mt-1 block min-w-[220px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              value={centerFilter}
              onChange={(event) => setCenterFilter(event.target.value)}
            >
              <option value="all">All Centers</option>
              {centers.map((center) => (
                <option key={center.centerId} value={center.centerId.toString()}>
                  {center.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Daily Bookings (Total)</p>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">{loading ? "--" : totals.totalBookings}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Served</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">{loading ? "--" : totals.totalServed}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Skipped</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-600">{loading ? "--" : totals.totalSkipped}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Avg Wait Time</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-600">
            {loading ? "--" : `${totals.avgWaitMinutes} min`}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">Daily Bookings Trend</h2>
          <p className="text-xs text-gray-500">Matches report metric: total_tokens_issued (grouped by date).</p>
          <div className="mt-4 h-72" data-testid="daily-bookings-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRows} margin={{ top: 12, right: 8, left: -16, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDisplayDate}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip labelFormatter={(label) => formatDisplayDate(label)} />
                <Bar dataKey="bookings" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">Served vs Skipped</h2>
          <p className="text-xs text-gray-500">Matches report metrics: total_served and total_skipped.</p>
          <div className="mt-4 h-72" data-testid="served-skipped-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servedSkippedSummary} margin={{ top: 12, right: 8, left: -16, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="served" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="skipped" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">Average Wait Time Trend</h2>
          <p className="text-xs text-gray-500">Matches report metric: avg_wait_time_seconds (converted to minutes).</p>
          <div className="mt-4 h-72" data-testid="avg-wait-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRows} margin={{ top: 12, right: 8, left: -16, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDisplayDate}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip labelFormatter={(label) => formatDisplayDate(label)} formatter={(value) => [`${value} min`, "Avg Wait"]} />
                <Bar dataKey="avgWaitMinutes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">Peak Hours</h2>
          <p className="text-xs text-gray-500">
            Matches center summary report peak hour values for the selected center.
          </p>
          <div className="mt-4 h-72" data-testid="peak-hours-chart">
            {selectedCenterId ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours} margin={{ top: 12, right: 8, left: -16, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip formatter={(value) => [value, "Peak Hour Tokens"]} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">
                Select a center to view peak hours.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
        {loading ? (
          <span>Loading analytics...</span>
        ) : (
          <span>
            Loaded in {loadMs} ms for {fromDate} to {toDate}
            {loadMs > 3000 ? ". Warning: load time exceeded 3 seconds." : "."}
          </span>
        )}
      </div>
    </div>
  );
}
