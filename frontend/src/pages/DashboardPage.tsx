import { Navigate, Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTokens } from "../hooks/useTokens";
import { UserTokenCard } from "../components/dashboard/UserTokenCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const BOOKING_TRENDS = [
  { name: 'Mon', tokens: 1 },
  { name: 'Tue', tokens: 0 },
  { name: 'Wed', tokens: 2 },
  { name: 'Thu', tokens: 0 },
  { name: 'Fri', tokens: 1 },
  { name: 'Sat', tokens: 0 },
  { name: 'Sun', tokens: 0 },
];

/** Auto-dismissing success toast duration (ms). */
const TOAST_DURATION = 4000;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { tokens, loading: loadingTokens, error, lastUpdated, refresh, cancelToken } =
    useTokens({ pollInterval: 30_000 });

  // ── Success toast ─────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), TOAST_DURATION);
  }, []);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  // ── Cancel handler ────────────────────────────────────────────
  const handleCancelToken = useCallback(async (tokenId: number) => {
    const tokenNumber = tokens.find(t => t.tokenId === tokenId)?.tokenNumber ?? "token";
    await cancelToken(tokenId); // throws on failure — card surfaces the error
    showToast(`Token ${tokenNumber} has been cancelled. Your queue spot has been released.`);
  }, [tokens, cancelToken, showToast]);

  if (!user) return <Navigate to="/login" replace />;

  // ── Last-updated label ────────────────────────────────────────
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center py-10 px-4 sm:px-6">
      {/* ── Success toast ── */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-50 border border-emerald-300 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] w-11/12 max-w-md animate-[fadeInDown_0.2s_ease]">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-800 text-sm font-bold flex-1">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="w-full max-w-6xl bg-white rounded-3xl p-8 sm:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back, {user.username}!</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
              Role: <span className="text-blue-600">{user.role}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/service-centers"
            className="px-6 py-3 bg-black hover:bg-gray-900 text-white text-sm font-bold rounded-full transition-colors shadow-sm"
          >
            Book a Token
          </Link>
          <button
            onClick={logout}
            className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-full transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Charts / Insights Row */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col">
          <div className="mb-6">
            <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">Your Weekly Activity</h3>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tokens Booked</p>
          </div>
          <div className="w-full flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BOOKING_TRENDS} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '13px', color: '#111827' }}
                />
                <Bar dataKey="tokens" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold">Quick Tip</h3>
            <p className="text-sm text-blue-100 font-medium mt-2 leading-relaxed">
              Arrive at the service center 15 minutes before your token's expected time to ensure you don't miss your turn.
            </p>
          </div>
          <div className="mt-6 relative z-10">
            <div className="text-5xl font-extrabold tracking-tighter">{tokens.length}</div>
            <div className="text-xs font-bold text-blue-200 uppercase tracking-widest mt-1">Active Tokens</div>
          </div>
        </div>
      </div>

      {/* Main Tokens Content */}
      <div className="w-full max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-200/60 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Active Queue Positions</h2>
            {!error && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Live</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {lastUpdatedLabel && (
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                Updated {lastUpdatedLabel}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loadingTokens}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-[12px] font-bold rounded-full hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loadingTokens ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 text-red-700 p-6 rounded-3xl text-center shadow-sm">
            <h3 className="font-bold text-[17px] mb-2">Failed to Load Tokens</h3>
            <p className="text-[13px] font-bold">{error}</p>
          </div>
        ) : loadingTokens ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border-dashed">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Fetching your queue positions...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border-dashed text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="font-bold text-[18px] text-gray-900 tracking-tight mb-2">No Active Tokens</h3>
            <p className="text-[13px] text-gray-500 font-bold mb-6">You aren't queued up for any services right now.</p>
            <Link to="/service-centers" className="inline-block px-6 py-2.5 bg-black text-white text-[13px] font-bold rounded-full hover:bg-gray-900 transition-colors shadow-sm">
              Find a Service Center
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <UserTokenCard key={token.tokenId} token={token} onCancel={handleCancelToken} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
