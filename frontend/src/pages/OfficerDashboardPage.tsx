import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCounter } from "../hooks/useCounter";
import { useQueueHub } from "../hooks/useQueueHub";
import ConnectionStatusBanner from "../components/common/ConnectionStatusBanner";
import { useLastUpdated } from "../hooks/useLastUpdated";
import { motion, AnimatePresence } from "framer-motion";

export default function OfficerDashboardPage() {
    const { user } = useAuth();
    const userCenterId = (user as { centerId?: number } | null)?.centerId;
    const [reconnectNonce, setReconnectNonce] = useState(0);

    const {
        latestCalledToken,
        latestStatusUpdate,
        latestReassignment,
        latestCancellation,
        latestQueueUpdate,
        connectionStatus,
        lastConnectedAt,
        reconnect,
    } = useQueueHub({
        centerId: userCenterId,
        counterId: user?.counterId,
        isOfficer: true,
        enabled: Boolean(user?.counterId),
        onReconnected: () => setReconnectNonce((prev) => prev + 1),
    });

    const {
        callNext,
        serveToken,
        skipToken,
        loading,
        serveLoading,
        skipLoading,
        serveError,
        skipError,
        waitingTokens,
        stats,
        dashboard,
        counterUnavailable,
        error,
        calledToken,
        dashboardLastUpdatedAt,
        fetchDashboard,
        fetchStats,
    } = useCounter(user?.counterId, userCenterId, {
        latestCalledToken,
        latestStatusUpdate,
        latestReassignment,
        latestCancellation,
        latestQueueUpdate,
    });

    const displayStats = stats;
    const { lastUpdatedText } = useLastUpdated(dashboardLastUpdatedAt || lastConnectedAt);
    const displayedCounterId = counterUnavailable ? null : (dashboard?.counterId ?? user?.counterId ?? null);
    const tokenActionInProgress = serveLoading || skipLoading;

    useEffect(() => {
        if (reconnectNonce <= 0) return;
        void fetchDashboard();
        void fetchStats();
    }, [reconnectNonce, fetchDashboard, fetchStats]);

    if (!user) return <Navigate to="/login" replace />;



    return (
        <div className="flex flex-col gap-8 py-4">
            <ConnectionStatusBanner
                connectionStatus={connectionStatus === "connecting" ? "reconnecting" : connectionStatus}
                onManualRefresh={() => {
                    void reconnect();
                    void fetchDashboard();
                    void fetchStats();
                }}
            />

            <div className="flex gap-12">
                {/* LEFT COLUMN: Real-time Metrics */}
                <div className="flex-1 flex flex-col gap-10 min-w-0">
                    
                    {/* OVERVIEW SECTION */}
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold tracking-tight text-gray-900">Queue Overview</h3>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm transition-all">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Station Time: {lastUpdatedText}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            {/* Waiting Card */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-premium transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-[#78d64b]/10 flex items-center justify-center text-[#78d64b]">
                                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                                    </div>
                                    <span className="text-sm font-bold text-gray-600">Customers Waiting</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-6xl font-black tracking-tighter text-gray-900">{waitingTokens.length}</h4>
                                </div>
                            </motion.div>

                            {/* Efficiency Card */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-premium transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                                    </div>
                                    <span className="text-sm font-bold text-gray-600">Daily Served</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-6xl font-black tracking-tighter text-gray-900">{displayStats?.servedCount || 0}</h4>
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {/* STATS SECTION */}
                    <section className="bg-gray-50/50 p-10 rounded-[2.5rem] border border-dashed border-gray-200">
                         <div className="flex flex-col gap-2">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Average Session Duration</p>
                             <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tighter text-gray-900">{displayStats ? Math.floor(displayStats.averageServiceTimeSeconds / 60) : 0}</span>
                                <span className="text-lg font-bold text-gray-400">minutes</span>
                             </div>
                         </div>
                    </section>
                </div>

                {/* RIGHT COLUMN: Station Controls & Activity */}
                <aside className="w-[360px] flex flex-col gap-10 shrink-0">
                    
                    {/* STATION CONTROLS */}
                    <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-black/[0.02]">
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                 <h2 className="text-lg font-black tracking-tight text-gray-900">Workstation</h2>
                                 <span className="px-2 py-0.5 bg-emerald-50 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest">Active</span>
                            </div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">
                                {displayedCounterId ? `Counter #${displayedCounterId}` : "Counter Unassigned"}
                            </p>
                        </div>

                        {counterUnavailable && (
                            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                                    {error || "Assigned counter is unavailable. Ask an admin to reassign your counter."}
                                </p>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {!calledToken ? (
                                <motion.button 
                                    key="call-next"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={callNext}
                                    disabled={loading}
                                    className="w-full aspect-square bg-gray-900 rounded-[2.5rem] flex flex-col items-center justify-center text-center group active:scale-95 transition-all shadow-2xl shadow-black/20"
                                >
                                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6 ring-8 ring-white/5 transition-transform group-hover:scale-110">
                                        {loading ? (
                                            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-10 h-10 text-[#78d64b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 4v16m8-8H4"/></svg>
                                        )}
                                    </div>
                                    <span className="text-white text-xl font-black tracking-tighter uppercase">Call Next</span>
                                </motion.button>
                            ) : (
                                <motion.div 
                                    key="token-actions"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="flex flex-col gap-4"
                                >
                                    <div className="bg-gray-50 p-8 rounded-[2rem] text-center mb-4 border border-gray-100 flex flex-col items-center min-h-[200px] justify-center overflow-hidden">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4 shrink-0">Current Token</span>
                                        <h4 className="text-3xl font-black tracking-tighter text-gray-900 break-all w-full line-clamp-3 leading-tight">{calledToken.tokenNumber}</h4>
                                    </div>
                                    
                                    {(serveError || skipError) && (
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center px-4 mb-2">
                                            {serveError || skipError}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={serveToken}
                                            disabled={tokenActionInProgress}
                                            className="h-16 bg-[#78d64b] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                                        >
                                            {serveLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Serve"}
                                        </button>
                                        <button 
                                            onClick={skipToken}
                                            disabled={tokenActionInProgress}
                                            className="h-16 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {skipLoading ? <div className="w-4 h-4 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" /> : "Skip"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>

                    {/* QUEUE FEED */}
                    <section className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex-1 flex flex-col min-h-0">
                        <h3 className="text-lg font-bold tracking-tight text-gray-900 mb-6 px-2">Next in Line</h3>
                        <div className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-hide">
                            <AnimatePresence mode="popLayout">
                                {waitingTokens.length === 0 ? (
                                    <div className="py-12 text-center grayscale opacity-40">
                                        <p className="text-[10px] font-black uppercase tracking-widest">No citizens waiting</p>
                                    </div>
                                ) : (
                                    waitingTokens.slice(0, 10).map((token) => (
                                        <motion.div 
                                            key={token.tokenId} 
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-[#78d64b]/10 group-hover:text-[#78d64b] transition-all">
                                                {token.tokenNumber.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-gray-900 truncate tracking-tight">{token.tokenNumber}</h4>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">In Queue</p>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}
