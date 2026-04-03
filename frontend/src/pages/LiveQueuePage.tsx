import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tokenApi } from "../api/tokenApi";
import type { QueuePositionDto } from "../api/tokenApi";
import { useServiceCenter } from "../hooks/useServiceCenters";
import { useQueueHub } from "../hooks/useQueueHub";
import ConnectionStatusBanner from "../components/common/ConnectionStatusBanner";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/common/ToastContainer";
import { useLastUpdated } from "../hooks/useLastUpdated";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveQueuePage() {
    const { centerId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const centerIdNum = centerId ? parseInt(centerId, 10) : 0;
    const { center } = useServiceCenter(centerIdNum);
    const [hasActiveToken, setHasActiveToken] = useState(false);
    const [, setMyActiveTokenId] = useState<number | null>(null);
    const [myActiveTokenNumber, setMyActiveTokenNumber] = useState<string | null>(null);

    const {
        latestCalledToken,
        latestStatusUpdate,
        latestReassignment,
        latestCancellation,
        latestQueueUpdate,
        connectionStatus,
        lastConnectedAt,
        reconnectAttempt,
        reconnect,
    } = useQueueHub({
        centerId: centerIdNum || undefined,
        enabled: Boolean(centerIdNum && hasActiveToken),
        onReconnected: () => {
            setReconnectNonce((prev) => prev + 1);
        },
    });

    const [currentServing, setCurrentServing] = useState<QueuePositionDto | null>(null);
    const [waitingList, setWaitingList] = useState<QueuePositionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [myTokenBanner, setMyTokenBanner] = useState<{ type: "served" | "cancelled"; message: string } | null>(null);
    const [queueLastUpdatedAt, setQueueLastUpdatedAt] = useState<Date | null>(null);
    const [reconnectNonce, setReconnectNonce] = useState(0);
    const { toasts, addToast, removeToast } = useToast();
    const { lastUpdatedText } = useLastUpdated(queueLastUpdatedAt ?? lastConnectedAt);

    // Live clock state
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchQueue = useCallback(async () => {
        if (!centerIdNum) return;
        try {
            const data = await tokenApi.getServiceCenterQueue(centerIdNum);
            setCurrentServing(data.length > 0 ? data[0] : null);
            setWaitingList(data.slice(1).map((token, index) => ({
                ...token,
                position: index + 1,
            })));
            setQueueLastUpdatedAt(new Date());
        } catch (error) {
            console.error("Failed to fetch queue", error);
        } finally {
            setLoading(false);
        }
    }, [centerIdNum]);

    const fetchActiveToken = useCallback(async () => {
        if (!centerIdNum || !user) {
            setHasActiveToken(false);
            setMyActiveTokenNumber(null);
            return;
        }

        try {
            const myTokens = await tokenApi.getMyTokens();
            const activeToken = myTokens.find((token) =>
                token.centerId === centerIdNum
                && ["Waiting", "Called", "Serving"].includes(token.status));

            setHasActiveToken(Boolean(activeToken));
            setMyActiveTokenId(activeToken?.tokenId ?? null);
            setMyActiveTokenNumber(activeToken?.tokenNumber ?? null);
        } catch {
            setHasActiveToken(false);
            setMyActiveTokenNumber(null);
        }
    }, [centerIdNum, user]);

    useEffect(() => {
        setLoading(true);
        void fetchActiveToken();
        void fetchQueue();
    }, [fetchQueue, fetchActiveToken]);

    useEffect(() => {
        if (reconnectNonce <= 0) return;
        void fetchQueue();
    }, [reconnectNonce, fetchQueue]);

    useEffect(() => {
        if (!latestCalledToken || latestCalledToken.centerId !== centerIdNum) return;
        setCurrentServing((prev) => ({
            tokenId: latestCalledToken.tokenId,
            tokenNumber: latestCalledToken.tokenNumber,
            status: latestCalledToken.status,
            position: prev?.position ?? 0,
            eta: null,
        }));
        setWaitingList((prev) => prev
            .filter((token) => token.tokenId !== latestCalledToken.tokenId)
            .map((token, index) => ({ ...token, position: index + 1 })));
        setQueueLastUpdatedAt(new Date());
        addToast(`Now serving token ${latestCalledToken.tokenNumber}`, "success", 4000);
    }, [latestCalledToken, centerIdNum, addToast]);

    useEffect(() => {
        if (!latestStatusUpdate || latestStatusUpdate.centerId !== centerIdNum) return;
        setWaitingList((prevQueue) => {
            const withoutUpdatedToken = prevQueue.filter((token) => token.tokenId !== latestStatusUpdate.tokenId);
            return withoutUpdatedToken.map((token, index) => ({
                ...token,
                position: index + 1,
            }));
        });
        setCurrentServing((prev) => (prev?.tokenId === latestStatusUpdate.tokenId ? null : prev));
        setQueueLastUpdatedAt(new Date());

        if (latestStatusUpdate.newStatus === "served"
            && (myActiveTokenNumber && myActiveTokenNumber === latestStatusUpdate.tokenNumber)) {
            setMyTokenBanner({ type: "served", message: "You have been served! Thank you." });
            setHasActiveToken(false);
        }
    }, [latestStatusUpdate, centerIdNum, myActiveTokenNumber]);

    useEffect(() => {
        if (!latestQueueUpdate || latestQueueUpdate.centerId !== centerIdNum) return;

        const updatedWaiting = (latestQueueUpdate.waitingTokens ?? []).map((token) => {
            const etaDate = new Date(Date.now() + Math.max(0, token.estimatedWaitSeconds ?? 0) * 1000).toISOString();
            return {
                tokenId: token.tokenId,
                tokenNumber: token.tokenNumber,
                status: "Waiting",
                position: token.queuePosition,
                eta: etaDate,
            } satisfies QueuePositionDto;
        });

        setWaitingList(updatedWaiting);
        setQueueLastUpdatedAt(new Date());
    }, [latestQueueUpdate, centerIdNum]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const dateStr = currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
    const timeStr = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
        <div className="h-screen w-full bg-[#f8f9fb] flex flex-col font-sans overflow-hidden selection:bg-[#78d64b]/30">
            <ConnectionStatusBanner
                connectionStatus={connectionStatus === "connecting" ? "reconnecting" : connectionStatus}
                onManualRefresh={() => {
                    setLoading(true);
                    void reconnect();
                    void fetchQueue();
                }}
            />

            {/* HEADER - CLEAN & HIGH-CONTRAST */}
            <header className="h-16 lg:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-12 shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/service-centers')}
                        className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M15 18l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] italic mb-1">Station Monitor</span>
                        <h1 className="text-xl font-bold tracking-tighter text-gray-900">{center?.name || "Service Center"}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-8 lg:gap-12">
                   <div className="hidden lg:flex flex-col text-right leading-none">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{dateStr}</span>
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tighter">{timeStr}</span>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-gray-900 font-black text-xs shadow-sm shadow-black/5 uppercase">
                            {user?.username?.charAt(0) || "U"}
                        </div>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{user?.username || "Guest"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "connected" ? "bg-[#78d64b] animate-pulse" : "bg-red-400"}`} />
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{connectionStatus}</span>
                    </div>
                </div>
            </header>

            {/* MAIN DASHBOARD */}
            <main className="flex-1 flex overflow-hidden">
                
                {/* ACTIVE MONITOR - CINEMATIC DISPLAY */}
                <section className="w-[62%] bg-white flex flex-col px-8 lg:px-16 py-10 relative overflow-hidden group">
                     {/* Decorative Hub Accent */}
                     <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#78d64b]/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
                     
                     <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-auto">
                           <div className="flex items-center gap-3 mb-4">
                              <span className="px-3 py-1 bg-gray-900 text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-full">Active Unit</span>
                              <div className="h-px flex-1 bg-gray-100" />
                           </div>
                           <h2 className="text-[13px] font-black text-gray-300 uppercase tracking-[0.4em] italic leading-tight">Current Synchronization</h2>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center py-10 min-h-0">
                            {currentServing ? (
                                <motion.div 
                                    key={currentServing.tokenNumber}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center w-full"
                                >
                                    <span 
                                        className="text-6xl lg:text-8xl font-black tracking-tighter leading-none text-gray-900 block break-all"
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                    >
                                        {currentServing.tokenNumber}
                                    </span>
                                    <div className="flex items-center justify-center gap-6 mt-8">
                                        <div className="bg-[#78d64b]/10 px-6 py-2 rounded-2xl border border-[#78d64b]/20">
                                            <span className="text-[10px] font-black text-[#78d64b] uppercase tracking-widest">Authorized</span>
                                        </div>
                                        <div className="h-px w-12 bg-gray-100" />
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Protocol 404</span>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-center">
                                    <span className="text-4xl lg:text-6xl font-black tracking-tighter text-gray-200 uppercase">Station Idle</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-4">Awaiting next synchronization</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-8 border-t border-gray-100 grid grid-cols-3 gap-8">
                            <div>
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block italic">Throughput</span>
                                <p className="text-lg lg:text-xl font-black text-gray-900 leading-none">{waitingList.length + (currentServing ? 1 : 0)} <span className="text-[10px] text-gray-400 ml-1">UNITS</span></p>
                            </div>
                            <div>
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block italic">Efficiency</span>
                                <p className="text-lg lg:text-xl font-black text-[#78d64b] leading-none">Optimal <span className="text-[10px] text-gray-400 ml-1">SYNC</span></p>
                            </div>
                            <div>
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block italic">Latency</span>
                                <p className="text-lg lg:text-xl font-black text-gray-900 leading-none">~14 <span className="text-[10px] text-gray-400 ml-1">MINS</span></p>
                            </div>
                        </div>
                     </div>
                </section>

                {/* NETWORK FLOW - DIRECTORY LISTING */}
                <section className="w-[38%] bg-[#f8f9fb] border-l border-gray-100 flex flex-col overflow-hidden relative">
                    <div className="p-8 pb-4 shrink-0">
                        <div className="flex items-center justify-between mb-2">
                             <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest italic leading-none">Network Flow</h3>
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{waitingList.length} Pending</span>
                        </div>
                        <div className="h-1 w-12 bg-[#78d64b] rounded-full" />
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-10 space-y-px scrollbar-hide">
                         <AnimatePresence mode="popLayout">
                            {waitingList.map((token, idx) => (
                                <motion.div
                                    key={token.tokenId}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group flex items-center gap-6 bg-white hover:bg-white p-5 lg:p-6 transition-all border-b border-gray-100/60 first:rounded-t-3xl last:rounded-b-3xl shadow-sm hover:shadow-premium hover:z-10 relative"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-xs group-hover:bg-[#78d64b]/10 group-hover:text-[#78d64b] transition-colors shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[13px] font-black text-gray-900 tracking-tight uppercase tracking-widest">{token.tokenNumber}</span>
                                            <span className="bg-[#78d64b]/5 text-[#78d64b] px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase">Waiting</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5 italic">
                                                <div className="w-1 h-1 rounded-full bg-[#78d64b]" />
                                                POSITION #{token.position}
                                            </span>
                                            <span className="bg-gray-50 px-2 py-0.5 rounded italic">
                                                SYNC: {token.eta ? Math.ceil((new Date(token.eta).getTime() - Date.now()) / 60000) : "--"} MIN
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                         </AnimatePresence>

                         {waitingList.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center py-32 text-center grayscale">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7" /></svg>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Network Flow Empty</p>
                            </div>
                         )}

                         <div className="pt-8 text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic opacity-60">
                                Last updated {lastUpdatedText}
                            </p>
                         </div>
                    </div>
                </section>
            </main>

            {myTokenBanner && (
                <motion.div 
                    initial={{ y: 100 }} 
                    animate={{ y: 0 }} 
                    className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 border border-white/20 backdrop-blur-md ${myTokenBanner.type === 'served' ? 'bg-[#78d64b] text-white' : 'bg-red-500 text-white'}`}
                >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">{myTokenBanner.message}</span>
                </motion.div>
            )}

            <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
        </div>
    );
}
