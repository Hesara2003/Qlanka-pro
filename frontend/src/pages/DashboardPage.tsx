import { Navigate, Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTokens } from "../hooks/useTokens";
import { useQueueHub } from "../hooks/useQueueHub";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/common/ToastContainer";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer
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

  const handleCancelToken = useCallback(async (tokenId: number) => {
    const tokenNumber = liveTokens.find(t => t.tokenId === tokenId)?.tokenNumber ?? "token";
    await cancelToken(tokenId);
    addToast(`Token ${tokenNumber} cancelled. Your spot has been released.`, "warning", 4000);
  }, [liveTokens, cancelToken, addToast]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="w-full h-full text-white pb-20 relative">
      {/* Floating Status Banners */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {turnAlert && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#78d64b] text-black px-6 py-4 rounded-2xl font-bold shadow-2xl flex items-center justify-between border border-white/20 pointer-events-auto">
              <span>🔔 IT'S YOUR TURN!</span>
            </motion.div>
          )}
          {servedBanner && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#78d64b] text-black px-6 py-4 rounded-2xl font-bold shadow-2xl border border-white/20 pointer-events-auto">
               ✨ {servedBanner}
            </motion.div>
          )}
          {cancelledBanner && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-2xl border border-white/20 pointer-events-auto">
               🚫 {cancelledBanner}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-2xl border border-white/20 pointer-events-auto">
               ⚠️ {error}
            </motion.div>
          )}
          {loadingTokens && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full font-bold shadow-2xl border border-white/10 flex items-center gap-3 self-center pointer-events-auto">
               <div className="w-3 h-3 border-2 border-white/20 border-t-[#78d64b] rounded-full animate-spin" />
               <span className="text-[10px] uppercase tracking-widest leading-none">Updating data...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dashboard Top Navigation / Header */}
      <div className="flex items-center justify-between mb-10 mt-2">
        <div className="flex items-center gap-10">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#78d64b] animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">75% OF TASKS COMPLETED TODAY</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
             <div className="w-2 h-2 rounded-full bg-orange-500" />
             <span className="text-xs font-bold text-gray-400">+4</span>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center font-bold text-black border-2 border-white/10">
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
        <p className="text-gray-500 text-lg">Automate tasks and achieve more every day.</p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Sidebar Mini Action Card */}
        <div className="col-span-12 lg:col-span-1">
          <div className="flex lg:flex-col gap-4 h-full">
             <button onClick={refresh} className="flex-1 bg-white/5 hover:bg-[#78d64b] group transition-all duration-300 rounded-2xl flex items-center justify-center p-4">
               <svg className={`w-6 h-6 text-white group-hover:text-black transition-colors ${loadingTokens ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
             </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3">
          <Link to="/service-centers" className="block bg-[#1a1c23]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] hover:bg-[#1a1c23] transition-all group h-full">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">JOIN QUEUE</span>
              <svg className="w-5 h-5 text-gray-600 group-hover:text-[#78d64b] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-1">Service Centers</h3>
            <p className="text-xs text-gray-500">Find a location near you</p>
          </Link>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-[#1a1c23]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">HISTORY</span>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Token Analyzer</h3>
              <p className="text-xs text-gray-500">Tracking past performance</p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-[#1a1c23]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ANALYTICS</span>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Queue Report</h3>
              <p className="text-xs text-gray-500">Daily wait time insights</p>
            </div>
          </div>
        </div>

        {/* Middle Row - Main Charts & Lists */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-[#1a1c23]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[3rem] h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold tracking-tight">Wait Time</h3>
              <select className="bg-transparent text-xs font-bold text-gray-400 border-none outline-none cursor-pointer">
                <option>Weekdays</option>
              </select>
            </div>
            <div className="w-full h-64 mt-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BOOKING_TRENDS} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }} dy={10} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 10 }}
                    contentStyle={{ backgroundColor: '#1a1c23', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '12px', color: '#78d64b' }}
                  />
                  <Bar 
                    dataKey="tokens" 
                    fill="#ca8a04" 
                    radius={[10, 10, 10, 10]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="bg-white p-8 rounded-[3rem] h-full text-black">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-bold">Tasks List</h3>
              <button onClick={refresh} className="text-xs font-bold text-gray-400 flex items-center gap-2 group">
                Refresh <svg className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${loadingTokens ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 italic">
                    <th className="pb-4">Location</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Position</th>
                    <th className="pb-4">Time</th>
                    <th className="pb-4">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {liveTokens.slice(0, 3).map((token, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-none">
                      <td className="py-4 font-bold">{token.centerName || 'Main Center'}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${token.status === 'Waiting' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {token.status}
                        </span>
                      </td>
                      <td className="py-4 font-black">#{token.queuePosition || '--'}</td>
                      <td className="py-4 text-gray-500 font-medium">{token.eta ? new Date(token.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</td>
                      <td className="py-4">
                        <button 
                          onClick={() => handleCancelToken(token.tokenId)}
                          className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {liveTokens.length === 0 && (
                     <tr>
                       <td colSpan={5} className="py-12 text-center text-gray-400 font-bold italic">No active tokens found.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Row - Secondary High Contrast Cards */}
        <div className="col-span-12 lg:col-span-5">
           <div className="bg-[#bef264] p-8 rounded-[3rem] h-full text-black relative overflow-hidden group">
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                     <h3 className="text-2xl font-bold tracking-tight">Queue Optimization</h3>
                  </div>
                  <p className="text-sm font-medium leading-relaxed max-w-[200px] mb-6">Arrive 10m early to ensure your spot is secured.</p>
                </div>
                <button className="w-fit px-6 py-3 bg-black text-white text-xs font-bold rounded-full hover:scale-105 transition-transform uppercase tracking-widest">
                  Setup Now
                </button>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400" 
                alt="" 
                className="absolute right-0 bottom-0 w-48 h-48 object-cover rounded-tl-[3rem] grayscale brightness-50 group-hover:grayscale-0 transition-all duration-700" 
              />
           </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
           <div className="bg-[#c7d2fe] p-8 rounded-[3rem] h-full text-[#1e1b4b]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">Completed Tasks</h3>
                  <p className="text-[10px] font-bold opacity-70 mt-1 uppercase tracking-widest">+22% TODAY</p>
                </div>
                <select className="bg-transparent text-[10px] font-bold border-none outline-none italic underline uppercase tracking-widest">
                   <option>Week</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-6">
                {/* Wave Graph Mockup */}
                <div className="w-full h-32 flex items-end gap-2 px-2">
                   {[40, 60, 45, 90, 70, 85, 100].map((h, i) => (
                     <div 
                      key={i} 
                      className="flex-1 bg-[#1e1b4b]/10 rounded-full flex items-end justify-center group relative cursor-pointer"
                      style={{ height: '100%' }}
                     >
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          className="w-full bg-[#1e1b4b] rounded-full transition-all group-hover:bg-indigo-600"
                        />
                     </div>
                   ))}
                </div>
                {/* Progress Indicator */}
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-xl shadow-sm">
                        30
                      </div>
                      <div className="w-3 h-3 rounded-full bg-white animate-ping" />
                   </div>
                </div>
              </div>
           </div>
        </div>

      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
