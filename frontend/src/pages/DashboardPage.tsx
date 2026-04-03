import { Navigate, Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useTokens } from "../hooks/useTokens";
import { useQueueHub } from "../hooks/useQueueHub";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/common/ToastContainer";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const { user } = useAuth();
  const { tokens, loading: loadingTokens, error, refresh, cancelToken } =
    useTokens({ pollInterval: 30_000 });
  const [liveTokens, setLiveTokens] = useState(tokens);
  const [turnAlert, setTurnAlert] = useState(false);
  const [servedBanner, setServedBanner] = useState<string | null>(null);
  const [cancelledBanner, setCancelledBanner] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const activeToken = liveTokens.find((token) => ["Waiting", "Called", "Serving"].includes(token.status)) ?? null;

  // SCRUM-74: Sort tokens to show cancelled/completed at the end
  const sortedTokens = useMemo(() => {
    return [...liveTokens].sort((a, b) => {
        const inactiveStatuses = ['Cancelled', 'Completed', 'Skipped'];
        const aInactive = inactiveStatuses.includes(a.status);
        const bInactive = inactiveStatuses.includes(b.status);
        
        if (aInactive && !bInactive) return 1;
        if (!aInactive && bInactive) return -1;
        
        // Secondary sort: newest first
        const dateA = new Date(`${a.issuedDate}T${a.issuedTime}`).getTime();
        const dateB = new Date(`${b.issuedDate}T${b.issuedTime}`).getTime();
        return dateB - dateA;
    });
  }, [liveTokens]);

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

  const handleCancelToken = useCallback(async (tokenId: number) => {
    const tokenNumber = liveTokens.find(t => t.tokenId === tokenId)?.tokenNumber ?? "token";
    await cancelToken(tokenId);
    addToast(`Token ${tokenNumber} cancelled. Your spot has been released.`, "warning", 4000);
  }, [liveTokens, cancelToken, addToast]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="w-full h-full text-gray-900 pb-20 relative">
      {/* Floating Status Banners */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {turnAlert && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#78d64b] text-black px-6 py-4 rounded-2xl font-bold shadow-2xl flex items-center justify-between border border-black/5 pointer-events-auto">
              <span>🔔 IT'S YOUR TURN!</span>
            </motion.div>
          )}
          {servedBanner && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#78d64b] text-black px-6 py-4 rounded-2xl font-bold shadow-2xl border border-black/5 pointer-events-auto">
               ✨ {servedBanner}
            </motion.div>
          )}
          {cancelledBanner && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-2xl border border-black/5 pointer-events-auto">
               🚫 {cancelledBanner}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-2xl border border-black/5 pointer-events-auto">
               ⚠️ {error}
            </motion.div>
          )}
          {loadingTokens && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-2xl border border-gray-100 flex items-center gap-3 self-center pointer-events-auto">
               <div className="w-3 h-3 border-2 border-gray-200 border-t-[#78d64b] rounded-full animate-spin" />
               <span className="text-[10px] uppercase tracking-widest leading-none">Updating data...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dashboard Top Navigation / Header */}
      <div className="flex items-center justify-between mb-10 mt-2">
        <div className="flex items-center gap-10">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-gray-100 border border-gray-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#78d64b] animate-pulse" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">REAL-TIME DASHBOARD</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-white border border-gray-100 hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-[#78d64b] flex items-center justify-center font-bold text-black border-2 border-white shadow-sm">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main Greeting Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl lg:text-6xl font-medium tracking-tight mb-3">
          Welcome, <span className="italic" style={{ fontFamily: "'Playfair Display', serif" }}>{user.username}!</span>
        </h1>
        <p className="text-gray-500 text-lg">Manage your active tokens and discover nearby centers.</p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Primary Action Card: Service Centers */}
        <div className="col-span-12 lg:col-span-4">
          <Link to="/service-centers" className="block bg-white border border-gray-100 p-8 rounded-[3rem] hover:bg-gray-50 transition-all group h-full shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GET STARTED</span>
              <div className="w-10 h-10 rounded-full bg-[#78d64b]/10 flex items-center justify-center text-[#78d64b] group-hover:bg-[#78d64b] group-hover:text-black transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M12 4v16m8-8H4"/></svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2 text-gray-900 tracking-tight">Join a Queue</h3>
            <p className="text-sm text-gray-500 max-w-[200px]">Find a service center nearby and get your token in seconds.</p>
            
            {/* Background Decorative Element */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#78d64b]/5 rounded-full blur-2xl group-hover:bg-[#78d64b]/10 transition-all" />
          </Link>
        </div>

        {/* Quick Stats Summary */}
        <div className="col-span-12 lg:col-span-8">
           <div className="bg-white border border-gray-100 p-8 rounded-[3rem] h-full shadow-sm relative overflow-hidden flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-1">Your Activity</h3>
                <p className="text-gray-400 text-sm font-medium tracking-tight">Managing your real-time tokens.</p>
              </div>
              <div className="flex gap-16 mr-8">
                <div className="text-center">
                  <p className="text-5xl font-black text-[#78d64b]">
                    {liveTokens.filter(t => !['Cancelled', 'Completed', 'Skipped'].includes(t.status)).length}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-black text-gray-100 italic">
                    {liveTokens.filter(t => ['Cancelled', 'Completed', 'Skipped'].includes(t.status)).length}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">History</p>
                </div>
              </div>
           </div>
        </div>

        {/* Main Tasks/Tokens Section */}
        <div className="col-span-12">
          <div className="bg-white border border-gray-100 p-8 lg:p-12 rounded-[3.5rem] min-h-[400px] text-gray-900 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-3xl font-bold tracking-tight mb-2">My Tokens</h3>
                <p className="text-gray-400 text-sm">Track your live position and estimated service times.</p>
              </div>
              <button onClick={refresh} className="text-[10px] font-black text-[#78d64b] uppercase tracking-widest flex items-center gap-3 px-6 py-3 bg-[#78d64b]/10 rounded-full hover:bg-[#78d64b] hover:text-black transition-all group">
                REFRESH DATA <svg className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-700 ${loadingTokens ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100 pb-6">
                    <th className="pb-6">Service Center</th>
                    <th className="pb-6">Current Status</th>
                    <th className="pb-6">Position</th>
                    <th className="pb-6">Estimated Time</th>
                    <th className="pb-6 text-center">Live Updates</th>
                    <th className="pb-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-base">
                  <AnimatePresence mode="popLayout">
                    {sortedTokens.map((token) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={token.tokenId} 
                        className="group border-b border-gray-50 last:border-none transition-colors hover:bg-gray-50/50"
                      >
                        <td className="py-8">
                          <div className="flex flex-col">
                             <span className="font-bold text-lg text-gray-900">{token.centerName || 'Main Hub'}</span>
                             <span className="text-xs text-gray-400 font-medium">Ticket ID: {token.tokenId}</span>
                          </div>
                        </td>
                        <td className="py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              token.status === 'Waiting' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              token.status === 'Serving' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              token.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              token.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                              'bg-gray-50 text-gray-600 border-gray-100'
                          }`}>
                            {token.status}
                          </span>
                        </td>
                        <td className="py-8 font-black text-3xl tracking-tighter text-[#78d64b]">
                          #{token.queuePosition || '--'}
                        </td>
                        <td className="py-8 text-gray-500 font-bold uppercase text-xs tracking-widest">
                          {token.eta ? new Date(token.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Calculating...'}
                        </td>
                        <td className="py-8 text-center">
                          {['Waiting', 'Called', 'Serving'].includes(token.status) ? (
                            <Link 
                              to={`/queue/${token.centerId}`}
                              className="inline-flex items-center gap-3 px-5 py-2.5 bg-gray-900 text-white hover:bg-black rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
                            >
                              <svg className="w-4 h-4 text-[#78d64b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              Open Queue
                            </Link>
                          ) : (
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Session Ended</span>
                          )}
                        </td>
                        <td className="py-8 text-right">
                          {['Waiting', 'Called', 'Serving'].includes(token.status) && (
                            <button 
                              onClick={() => handleCancelToken(token.tokenId)}
                              className="w-10 h-10 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center ml-auto border border-red-100"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {liveTokens.length === 0 && (
                     <tr>
                       <td colSpan={6} className="py-32 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-4">
                             <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             </div>
                             <p className="font-bold uppercase tracking-widest text-xs">No active tokens found</p>
                             <Link to="/service-centers" className="text-[#78d64b] font-black text-[10px] uppercase tracking-widest hover:underline transition-all mt-2">Get your first token →</Link>
                          </div>
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
