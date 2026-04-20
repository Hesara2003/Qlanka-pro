import { useEffect, useMemo, useState } from "react";
import { getAllServiceCenters } from "../../api/serviceCenterApi";
import {
  downloadCustomReport,
  getDashboardAnalytics,
  type DashboardAnalyticsDto,
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

function formatMinutes(totalSeconds: number): string {
  return `${(totalSeconds / 60).toFixed(1)} min`;
}

function formatHour(hour: number): string {
  if (!Number.isFinite(hour) || hour < 0) return "-";
  return `${hour.toString().padStart(2, "0")}:00`;
}

export default function ReportAnalyticsPanel() {
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"csv" | "pdf" | null>(null);
  const [error, setError] = useState<string>("");

  const [fromDate, setFromDate] = useState(defaultFromDate());
  const [toDate, setToDate] = useState(today());
  const [selectedCenterId, setSelectedCenterId] = useState<string>("all");

  const [analytics, setAnalytics] = useState<DashboardAnalyticsDto | null>(null);

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
        const payload = await getDashboardAnalytics(fromDate, toDate, centerIds);
        if (cancelled) return;

        setAnalytics(payload);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load analytics data.");
          setAnalytics(null);
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

  const dailyBookings = useMemo<DailyPoint[]>(() => {
    if (!analytics) return [];

    return analytics.dailyBookings.map((point) => ({
      date: point.date,
      bookings: point.bookings,
    }));
  }, [analytics]);

  const totalBookings = analytics?.totalBookings ?? 0;
  const totalServed = analytics?.totalServed ?? 0;
  const totalSkipped = analytics?.totalSkipped ?? 0;
  const servedRate = totalBookings > 0 ? Math.round((totalServed / totalBookings) * 100) : 0;
  const skippedRate = totalBookings > 0 ? Math.round((totalSkipped / totalBookings) * 100) : 0;

  const servedSkippedData = useMemo(
    () => [
      { label: "Served", value: analytics?.totalServed ?? 0 },
      { label: "Skipped", value: analytics?.totalSkipped ?? 0 },
    ],
    [analytics]
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {[
          {
            label: "Total bookings",
            value: totalBookings,
            note: `${fromDate} to ${toDate}`,
          },
          {
            label: "Served",
            value: totalServed,
            note: `${servedRate}% of filtered tokens`,
          },
          {
            label: "Skipped",
            value: totalSkipped,
            note: `${skippedRate}% of filtered tokens`,
          },
          {
            label: "Avg wait time",
            value: analytics ? formatMinutes(analytics.averageWaitTimeSeconds) : "0.0 min",
            note: "Filtered service timing",
          },
          {
            label: "Peak hour",
            value: analytics ? formatHour(analytics.peakHour) : "-",
            note: `${analytics?.peakHourTokenCount ?? 0} bookings at peak`,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 shadow-[0_1px_0_rgba(17,24,39,0.02)]">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{card.label}</div>
            <div className="text-3xl font-semibold text-gray-900 tracking-tight leading-none">{card.value}</div>
            <div className="text-[11px] text-gray-500 mt-2">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gray-50 rounded-2xl p-4 border border-gray-100 min-h-65">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Daily bookings</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Filtered</div>
          </div>
          {loading ? (
            <div className="h-52.5 flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>
          ) : dailyBookings.length === 0 ? (
            <div className="h-52.5 flex items-center justify-center text-gray-400 text-sm">No bookings match the selected filters.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyBookings} margin={{ top: 8, left: -20, right: 8, bottom: 0 }}>
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
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Served vs skipped</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Filtered</div>
          </div>
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
    </section>
  );
}
