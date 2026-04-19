import { useEffect, useMemo, useState } from "react";
import { getAllServiceCenters } from "../../api/serviceCenterApi";
import {
  downloadCustomReport,
  getCustomReportPreview,
  type CustomReportPreviewDto,
} from "../../api/reportsApi";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import type { ServiceCenter } from "../../types/serviceCenter";

type DailyPoint = {
  date: string;
  bookings: number;
};

function defaultFromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function parseMetricNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function mapRows(headers: string[], rows: string[][]) {
  const idxDate = headers.indexOf("Date");
  const idxIssued = headers.indexOf("Tokens Issued");
  const idxServed = headers.indexOf("Served");
  const idxSkipped = headers.indexOf("Skipped");
  const idxAvgWait = headers.indexOf("Avg Wait Time (min)");
  const idxPeakHour = headers.indexOf("Peak Hour");
  const idxPeakHourTokens = headers.indexOf("Peak Hour Tokens");

  const dailyMap = new Map<string, number>();
  let totalServed = 0;
  let totalSkipped = 0;
  let waitSum = 0;
  let waitCount = 0;
  let peakHour = "-";
  let peakHourTokens = 0;

  for (const row of rows) {
    const date = idxDate >= 0 ? row[idxDate] : "";
    const issued = idxIssued >= 0 ? parseMetricNumber(row[idxIssued]) : 0;
    const served = idxServed >= 0 ? parseMetricNumber(row[idxServed]) : 0;
    const skipped = idxSkipped >= 0 ? parseMetricNumber(row[idxSkipped]) : 0;
    const avgWait = idxAvgWait >= 0 ? parseMetricNumber(row[idxAvgWait]) : 0;
    const pHour = idxPeakHour >= 0 ? row[idxPeakHour] : "-";
    const pHourTokens = idxPeakHourTokens >= 0 ? parseMetricNumber(row[idxPeakHourTokens]) : 0;

    if (date) {
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + issued);
    }

    totalServed += served;
    totalSkipped += skipped;

    if (avgWait > 0) {
      waitSum += avgWait;
      waitCount += 1;
    }

    if (pHourTokens > peakHourTokens) {
      peakHourTokens = pHourTokens;
      peakHour = pHour;
    }
  }

  const dailyBookings: DailyPoint[] = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, bookings]) => ({ date, bookings }));

  return {
    dailyBookings,
    totalServed,
    totalSkipped,
    avgWaitTime: waitCount > 0 ? waitSum / waitCount : 0,
    peakHour,
    peakHourTokens,
  };
}

export default function ReportAnalyticsPanel() {
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"csv" | "pdf" | null>(null);
  const [error, setError] = useState<string>("");

  const [fromDate, setFromDate] = useState(defaultFromDate());
  const [toDate, setToDate] = useState(today());
  const [selectedCenterId, setSelectedCenterId] = useState<string>("all");

  const [preview, setPreview] = useState<CustomReportPreviewDto | null>(null);

  useEffect(() => {
    getAllServiceCenters()
      .then(setCenters)
      .catch(() => setCenters([]));
  }, []);

  const centerIds = useMemo(() => {
    if (selectedCenterId === "all") return [] as number[];
    const parsed = Number(selectedCenterId);
    return Number.isFinite(parsed) ? [parsed] : [];
  }, [selectedCenterId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const metrics = [
          "totalTokensIssued",
          "served",
          "skipped",
          "avgWaitTime",
          "peakHour",
          "peakHourTokenCount",
        ];

        const firstPage = await getCustomReportPreview(fromDate, toDate, centerIds, metrics, 1, 5000);
        if (cancelled) return;

        setPreview(firstPage);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load analytics data.");
          setPreview(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate, centerIds]);

  const analytics = useMemo(() => {
    if (!preview) {
      return {
        dailyBookings: [] as DailyPoint[],
        totalServed: 0,
        totalSkipped: 0,
        avgWaitTime: 0,
        peakHour: "-",
        peakHourTokens: 0,
      };
    }

    return mapRows(preview.headers, preview.rows);
  }, [preview]);

  const servedSkippedData = useMemo(
    () => [
      { label: "Served", value: analytics.totalServed },
      { label: "Skipped", value: analytics.totalSkipped },
    ],
    [analytics.totalServed, analytics.totalSkipped]
  );

  async function onDownload(format: "csv" | "pdf") {
    setDownloading(format);
    setError("");
    try {
      await downloadCustomReport(fromDate, toDate, {
        centerIds,
        metrics: [
          "totalTokensIssued",
          "served",
          "skipped",
          "avgWaitTime",
          "peakHour",
          "peakHourTokenCount",
        ],
        format,
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to download report.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Booking Analytics</h2>
          <p className="text-[11px] text-gray-400">Daily trends and service efficiency by filter selection.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownload("csv")}
            disabled={!!downloading || loading}
            className="px-3 py-2 rounded-xl border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {downloading === "csv" ? "Downloading..." : "Export CSV"}
          </button>
          <button
            onClick={() => onDownload("pdf")}
            disabled={!!downloading || loading}
            className="px-3 py-2 rounded-xl bg-gray-900 text-white text-[11px] font-semibold hover:bg-black disabled:opacity-60"
          >
            {downloading === "pdf" ? "Downloading..." : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Center</span>
          <select
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
          >
            <option value="all">All centers</option>
            {centers.map((center) => (
              <option key={center.centerId} value={center.centerId}>
                {center.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg border border-red-100 bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gray-50 rounded-2xl p-4 border border-gray-100 min-h-65">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Daily bookings</div>
          {loading ? (
            <div className="h-52.5 flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics.dailyBookings} margin={{ top: 8, left: -20, right: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="bookings" stroke="#111827" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-h-65">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Served vs skipped</div>
          {loading ? (
            <div className="h-52.5 flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={servedSkippedData} margin={{ top: 8, left: 0, right: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#78d64b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="rounded-2xl border border-gray-100 px-5 py-4">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Average wait time</div>
          <div className="text-3xl font-semibold text-gray-900">{analytics.avgWaitTime.toFixed(1)} min</div>
        </div>

        <div className="rounded-2xl border border-gray-100 px-5 py-4">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Peak hour</div>
          <div className="text-3xl font-semibold text-gray-900">{analytics.peakHour}</div>
          <div className="text-[11px] text-gray-500 mt-1">{analytics.peakHourTokens} bookings at peak</div>
        </div>
      </div>
    </section>
  );
}
