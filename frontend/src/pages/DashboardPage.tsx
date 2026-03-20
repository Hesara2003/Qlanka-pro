// frontend/src/pages/DashboardPage.tsx

import { Navigate, Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTokens } from "../hooks/useTokens";
import { UserTokenCard } from "../components/dashboard/UserTokenCard";
import { useQueueHub } from "../hooks/useQueueHub";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/common/ToastContainer";
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

export default function DashboardPage() {
  const { user } = useAuth();
  const { tokens, loading: loadingTokens, error, lastUpdated, refresh, cancelToken } =
    useTokens({ pollInterval: 30_000 });
  const [liveTokens, setLiveTokens] = useState(tokens);
  const [turnAlert, setTurnAlert] = useState(false);
  const [servedBanner, setServedBanner] = useState<string | null>(null);
  const [cancelledBanner, setCancelledBanner] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const activeToken = liveTokens.find((token) => ["Waiting", "Called", "Serving"].includes(token.status)) ?? null;

  const { latestCalledToken, latestStatusUpdate, latestCancellation, latestQueueUpdate } = useQueueHub({
    centerId: activeToken?.centerId,
    enabled: Boolean(activeToken),
    onReconnected: async () => {
      refresh();
    },
  });

  useEffect(() => {
    setLiveTokens(tokens);
  }, [tokens]);

  const turnAlertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (turnAlertTimerRef.current) {
      clearTimeout(turnAlertTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!latestCalledToken || !activeToken) return;
    if (latestCalledToken.centerId !== activeToken.centerId) return;
    if (latestCalledToken.tokenNumber !== activeToken.tokenNumber) return;

    setTurnAlert(true);
    addToast("It's your turn!", "success", 4000);

    if (turnAlertTimerRef.current) {
      clearTimeout(turnAlertTimerRef.current);
    }

    turnAlertTimerRef.current = setTimeout(() => {
      setTurnAlert(false);
    }, 4000);
  }, [latestCalledToken, activeToken, addToast]);

  useEffect(() => {
    if (!latestStatusUpdate || !activeToken) return;
    if (latestStatusUpdate.centerId !== activeToken.centerId) return;

    setLiveTokens((prev) => prev.map((token) => {
      if (token.tokenNumber !== latestStatusUpdate.tokenNumber) {
        return token;
      }

      if (latestStatusUpdate.newStatus === "served") {
        return { ...token, status: "Served", servedTime: latestStatusUpdate.servedAt };
      }

      if (latestStatusUpdate.newStatus === "skipped") {
        return { ...token, status: "Skipped" };
      }

      return token;
    }));

    if (latestStatusUpdate.newStatus === "served" && latestStatusUpdate.tokenNumber === activeToken.tokenNumber) {
      setServedBanner("You have been served! Thank you.");
    }
  }, [latestStatusUpdate, activeToken]);

  useEffect(() => {
    if (!servedBanner) return;
    const timeoutId = window.setTimeout(() => setServedBanner(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [servedBanner]);

  useEffect(() => {
    if (!latestCancellation || !activeToken) return;
    if (latestCancellation.centerId !== activeToken.centerId) return;

    setLiveTokens((prev) => prev.map((token) => (
      token.tokenNumber === latestCancellation.tokenNumber
        ? { ...token, status: "Cancelled", cancelledAt: latestCancellation.cancelledAt }
        : token
    )));

    if (latestCancellation.tokenNumber === activeToken.tokenNumber) {
      setCancelledBanner("Your token has been cancelled.");
    }
  }, [latestCancellation, activeToken]);

  useEffect(() => {
    if (!cancelledBanner) return;
    const timeoutId = window.setTimeout(() => setCancelledBanner(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [cancelledBanner]);

  useEffect(() => {
    if (!latestQueueUpdate || !activeToken) return;
    if (latestQueueUpdate.centerId !== activeToken.centerId) return;

    const waitingTokenMap = new Map(
      (latestQueueUpdate.waitingTokens ?? []).map((token) => [token.tokenNumber, token]),
    );

    setLiveTokens((prev) => prev.map((token) => {
      const waitingToken = waitingTokenMap.get(token.tokenNumber);
      if (!waitingToken) {
        return token;
      }

      const etaIso = new Date(Date.now() + Math.max(0, waitingToken.estimatedWaitSeconds ?? 0) * 1000).toISOString();
      return {
        ...token,
        queuePosition: waitingToken.queuePosition,
        eta: etaIso,
      };
    }));
  }, [latestQueueUpdate, activeToken]);

  // ── Cancel handler ────────────────────────────────────────────
  const handleCancelToken = useCallback(async (tokenId: number) => {
    const tokenNumber = liveTokens.find(t => t.tokenId === tokenId)?.tokenNumber ?? "token";
    await cancelToken(tokenId); // throws on failure — card surfaces the error
    addToast(`Token ${tokenNumber} has been cancelled. Your queue spot has been released.`, "warning", 4000);
  }, [liveTokens, cancelToken, addToast]);

  if (!user) return <Navigate to="/login" replace />;

  // ── Last-updated label ────────────────────────────────────────
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="w-full flex flex-col pt-4">
      {turnAlert && (
        <div className="w-full mb-4 bg-[#78d64b] text-black px-4 py-3 rounded-lg font-bold text-sm animate-pulse">
          It&apos;s your turn!
        </div>
      )}

      {servedBanner && (
        <div className="w-full mb-4 bg-[#78d64b] text-black px-4 py-3 rounded-lg font-semibold text-sm">
          {servedBanner}
        </div>
      )}

      {cancelledBanner && (
        <div className="w-full mb-4 bg-red-500 text-white px-4 py-3 rounded-lg font-semibold text-sm">
          {cancelledBanner}
        </div>
      )}

      {/* Book a Token Action Bar */}
      <div className="w-full bg-[#1a1c23] rounded-[2rem] p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#78d64b] opacity-10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 mb-6 md:mb-0">
          <h2 className="text-2xl font-bold tracking-tight">Need to visit a center?</h2>
          <p className="text-[15px] text-gray-300 mt-2 font-medium">Find a center near you and join the queue virtually.</p>
        </div>
        <Link
          to="/service-centers"
          className="relative z-10 px-8 py-4 bg-[#78d64b] hover:bg-[#68c63b] text-[#1a1c23] text-sm font-bold rounded-full transition-colors shadow-lg whitespace-nowrap active:scale-95"
        >
          Book a Token
        </Link>
      </div>

      {/* Charts / Insights Row */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1a1c23] tracking-tight">Your Weekly Activity</h3>
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
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '13px', color: '#1a1c23' }}
                />
                <Bar dataKey="tokens" fill="#1a1c23" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#78d64b] rounded-[2rem] p-8 text-[#1a1c23] shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20 text-[#0a5c4e]">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold tracking-tight">Quick Tip</h3>
            <p className="text-sm font-semibold opacity-90 mt-2 leading-relaxed">
              Arrive at the service center 15 minutes before your token's expected time to ensure you don't miss your turn.
            </p>
          </div>
          <div className="mt-8 relative z-10">
            <div className="text-6xl font-extrabold tracking-tighter">{liveTokens.length}</div>
            <div className="text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Active Tokens</div>
          </div>
        </div>
      </div>

      {/* Main Tokens Content */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-gray-200/60 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#1a1c23] tracking-tight">Active Queue Positions</h2>
            {!error && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Live</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {lastUpdatedLabel && (
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:block">
                Updated {lastUpdatedLabel}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loadingTokens}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 border-none text-white text-xs font-bold rounded-full hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loadingTokens ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-[#1a1c23] border border-red-500/20 text-red-500 p-6 rounded-[2rem] text-center shadow-lg">
            <h3 className="font-bold text-[17px] mb-2">Failed to Load Tokens</h3>
            <p className="text-[13px] font-bold">{error}</p>
          </div>
        ) : loadingTokens ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[#1a1c23] rounded-[2rem] border border-gray-800 shadow-xl border-dashed">
            <div className="w-10 h-10 border-4 border-gray-800 border-t-[#78d64b] rounded-full animate-spin mb-4" />
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Fetching your queue positions...</p>
          </div>
        ) : liveTokens.length === 0 ? (
          <div className="bg-[#1a1c23] p-12 rounded-[2rem] border border-gray-800 shadow-xl border-dashed text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="font-bold text-[18px] text-white tracking-tight mb-2">No Active Tokens</h3>
            <p className="text-[13px] text-gray-400 font-bold mb-6">You aren't queued up for any services right now.</p>
            <Link to="/service-centers" className="inline-block px-8 py-3 bg-[#78d64b] text-black text-[14px] font-bold rounded-full hover:bg-[#65b83f] transition-colors shadow-sm">
              Find a Service Center
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveTokens.map((token) => (
              <UserTokenCard key={token.tokenId} token={token} onCancel={handleCancelToken} />
            ))}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
