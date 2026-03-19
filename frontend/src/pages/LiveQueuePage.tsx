// frontend/src/pages/LiveQueuePage.tsx

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

export default function LiveQueuePage() {
    const { centerId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const centerIdNum = centerId ? parseInt(centerId, 10) : 0;
    const { center } = useServiceCenter(centerIdNum);
    const [hasActiveToken, setHasActiveToken] = useState(false);
    const [myActiveTokenId, setMyActiveTokenId] = useState<number | null>(null);
    const [myActiveTokenNumber, setMyActiveTokenNumber] = useState<string | null>(null);

    const {
        latestCalledToken,
        latestStatusUpdate,
        latestReassignment,
        latestCancellation,
        latestQueueUpdate,
        connectionStatus,
        reconnect,
    } = useQueueHub({
        centerId: centerIdNum || undefined,
        enabled: Boolean(centerIdNum && hasActiveToken),
    });

    const [currentServing, setCurrentServing] = useState<QueuePositionDto | null>(null);
    const [waitingList, setWaitingList] = useState<QueuePositionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [myTokenBanner, setMyTokenBanner] = useState<{ type: "served" | "cancelled"; message: string } | null>(null);
    const { toasts, addToast, removeToast } = useToast();

    // Mock timer state for "Serving Time"
    const [servingTime, setServingTime] = useState(0);

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
        } catch (error) {
            console.error("Failed to fetch queue", error);
        } finally {
            setLoading(false);
        }
    }, [centerIdNum]);

    const fetchActiveToken = useCallback(async () => {
        if (!centerIdNum || !user) {
            setHasActiveToken(false);
            setMyActiveTokenId(null);
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
            setMyActiveTokenId(null);
            setMyActiveTokenNumber(null);
        }
    }, [centerIdNum, user]);

    useEffect(() => {
        setLoading(true);
        void fetchActiveToken();
        void fetchQueue();
    }, [fetchQueue, fetchActiveToken]);

    useEffect(() => {
        if (!latestCalledToken || latestCalledToken.centerId !== centerIdNum) return;
        setServingTime(0);
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
        addToast(`Now serving token ${latestCalledToken.tokenNumber}`, "success", 4000);
    }, [latestCalledToken, centerIdNum, addToast]);

    useEffect(() => {
        if (!latestStatusUpdate || latestStatusUpdate.centerId !== centerIdNum) return;
        setServingTime(0);

        setWaitingList((prevQueue) => {
            const withoutUpdatedToken = prevQueue.filter((token) => token.tokenId !== latestStatusUpdate.tokenId);
            return withoutUpdatedToken.map((token, index) => ({
                ...token,
                position: index + 1,
            }));
        });
        setCurrentServing((prev) => (prev?.tokenId === latestStatusUpdate.tokenId ? null : prev));

        const verb = latestStatusUpdate.newStatus === "served" ? "has been served" : "was skipped";
        addToast(`Token ${latestStatusUpdate.tokenNumber} ${verb}`, latestStatusUpdate.newStatus === "served" ? "success" : "warning", 4000);

        if (latestStatusUpdate.newStatus === "served"
            && (myActiveTokenId === latestStatusUpdate.tokenId
                || (myActiveTokenNumber && myActiveTokenNumber === latestStatusUpdate.tokenNumber))) {
            setMyTokenBanner({ type: "served", message: "You have been served! Thank you." });
            setHasActiveToken(false);
        }
    }, [latestStatusUpdate, centerIdNum, addToast, myActiveTokenId, myActiveTokenNumber]);

    useEffect(() => {
        if (!latestReassignment || latestReassignment.centerId !== centerIdNum) return;

        setWaitingList((prevQueue) => prevQueue
            .map((token, index) => ({
                ...token,
                position: index + 1,
            })));

        if ((myActiveTokenId && myActiveTokenId === latestReassignment.tokenId)
            || (myActiveTokenNumber && myActiveTokenNumber === latestReassignment.tokenNumber)) {
            addToast(`Your token has been moved to Counter #${latestReassignment.targetCounterId}`, "info", 4000);
        }
    }, [latestReassignment, centerIdNum, myActiveTokenId, myActiveTokenNumber, addToast]);

    useEffect(() => {
        if (!latestCancellation || latestCancellation.centerId !== centerIdNum) return;

        setWaitingList((prevQueue) => prevQueue
            .filter((token) => token.tokenId !== latestCancellation.tokenId)
            .map((token, index) => ({
                ...token,
                position: index + 1,
            })));
        setCurrentServing((prev) => (prev?.tokenId === latestCancellation.tokenId ? null : prev));

        addToast(`Token ${latestCancellation.tokenNumber} has been cancelled`, "error", 4000);

        if ((myActiveTokenId && myActiveTokenId === latestCancellation.tokenId)
            || (myActiveTokenNumber && myActiveTokenNumber === latestCancellation.tokenNumber)) {
            setMyTokenBanner({ type: "cancelled", message: "Your token has been cancelled." });
            setHasActiveToken(false);
        }
    }, [latestCancellation, centerIdNum, addToast, myActiveTokenId, myActiveTokenNumber]);

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
    }, [latestQueueUpdate, centerIdNum]);

    useEffect(() => {
        if (!myTokenBanner) return;

        const timeout = setTimeout(() => {
            setMyTokenBanner(null);
        }, 4000);

        return () => clearTimeout(timeout);
    }, [myTokenBanner]);

    // Serving time counter effect
    useEffect(() => {
        const timer = setInterval(() => {
            setServingTime(prev => prev + 1);
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Format seconds to HH:MM:SS
    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Format current exact time and date for the header
    const dateStr = currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
        <div className="h-screen w-full bg-[#f0f2f5] flex flex-col font-sans overflow-hidden">
            <ConnectionStatusBanner
                connectionStatus={connectionStatus}
                onManualRefresh={() => {
                    setLoading(true);
                    void reconnect();
                    void fetchQueue();
                }}
            />

            {myTokenBanner?.type === "served" && (
                <div className="w-full mb-3 rounded-lg bg-[#78d64b] text-black px-4 py-3 font-semibold text-sm">
                    {myTokenBanner.message}
                </div>
            )}

            {myTokenBanner?.type === "cancelled" && (
                <div className="w-full mb-3 rounded-lg bg-red-500 text-white px-4 py-3 font-semibold text-sm flex items-center justify-between">
                    <span>{myTokenBanner.message}</span>
                    <button
                        onClick={() => navigate("/service-centers")}
                        className="underline underline-offset-2 text-white text-xs font-bold"
                    >
                        Rebook
                    </button>
                </div>
            )}

            {/* Header Navbar */}
            <div className="h-16 lg:h-20 bg-[#003d7b] flex items-center justify-between px-6 lg:px-10 text-white shrink-0 shadow-md z-10">
                <div className="flex items-center gap-4 border border-[#ffffff33] rounded-lg p-2 bg-[#002f5e]">
                    <div className="font-extrabold text-white tracking-widest text-lg md:text-xl flex items-center">
                        <span className="text-[#f58220] mr-1">Q</span>LANKA
                    </div>
                </div>

                <div className="flex items-center gap-4 lg:gap-8">
                    <div className="hidden md:flex flex-col text-right leading-tight opacity-90 border-r border-[#ffffff33] pr-6">
                        <div className="font-medium text-[15px]">{dateStr}</div>
                        <div className="font-bold text-lg">{timeStr}</div>
                    </div>

                    <div className="flex items-center gap-3 border-r border-[#ffffff33] pr-6">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#003d7b] font-bold text-lg overflow-hidden shadow-inner">
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="hidden sm:block text-[15px] font-semibold tracking-wide">
                            {user?.username || "Guest"}
                        </span>
                    </div>

                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 hover:bg-[#ffffff1a] px-4 py-2 rounded-lg transition-colors font-semibold"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="hidden sm:block">Exit</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area - 2 Columns */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Column: Current Monitor */}
                <div className="w-[62%] bg-white flex flex-col px-6 py-4 relative shadow-[10px_0_15px_-3px_rgba(0,0,0,0.05)] z-[5]">
                    <div className="flex-1 min-h-0 flex flex-col items-center justify-center border border-gray-100 rounded-2xl bg-gray-50/50 relative overflow-hidden py-4">

                        {/* Decorative background circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-50/50 to-orange-50/30 rounded-full blur-3xl opacity-60 -z-10" />

                        <div className="text-center w-full max-w-lg px-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-orange-100 border border-orange-200 mb-3">
                                <div className="w-2 h-2 rounded-full bg-[#f58220] animate-pulse" />
                                <h2 className="text-[#f58220] font-bold text-sm uppercase tracking-widest">Now Serving</h2>
                            </div>

                            <h1 className="text-[#003d7b] font-extrabold text-2xl mb-3 tracking-tight">Token Number</h1>

                            {/* Orange Token Display Box */}
                            <div className="mx-auto border-[4px] border-[#f58220] bg-white rounded-2xl w-full max-w-[380px] h-36 flex items-center justify-center shadow-2xl mb-4 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <span className="text-[#f58220] text-[100px] font-black tracking-tighter leading-none relative z-10" style={{ textShadow: '0 8px 24px rgba(245, 130, 32, 0.2)' }}>
                                    {currentServing ? currentServing.tokenNumber : "---"}
                                </span>
                            </div>

                            <div className="flex flex-col items-center justify-center">
                                <h3 className="text-gray-500 font-bold text-xs mb-1.5 tracking-widest uppercase">Serving Time</h3>
                                <div className="text-[#003d7b] font-bold text-3xl tracking-wider font-mono bg-white px-5 py-2 rounded-xl shadow-sm border border-gray-100">
                                    {currentServing ? formatTime(servingTime) : "00:00:00"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Stats Row */}
                    <div className="flex items-center justify-center gap-8 shrink-0 py-3 mt-3 border-t border-gray-100">
                        <div className="text-center">
                            <p className="text-gray-500 font-bold text-xs tracking-widest uppercase mb-0.5">Tokens Served</p>
                            <p className="text-[#003d7b] font-black text-2xl">{waitingList.length + (currentServing ? 1 : 0)}</p>
                        </div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="text-center">
                            <p className="text-gray-500 font-bold text-xs tracking-widest uppercase mb-0.5">Avg Wait Time</p>
                            <p className="text-[#003d7b] font-black text-2xl">~14 min</p>
                        </div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="text-center">
                            <p className="text-gray-500 font-bold text-xs tracking-widest uppercase mb-0.5">Status</p>
                            <p className="text-emerald-500 font-black text-2xl flex items-center gap-1.5">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Optimal
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Waiting List Viewer */}
                <div className="flex flex-col w-[38%] bg-[#f8f9fa] border-l border-gray-200 shadow-inner">
                    <div className="h-16 bg-[#f58220] text-white flex flex-col items-center justify-center font-bold px-6 shrink-0 shadow-md relative z-10">
                        <span className="text-xl tracking-wide">{waitingList.length}</span>
                        <span className="text-xs font-medium uppercase tracking-widest opacity-90">Visitors Waiting</span>
                    </div>
                    <div className="h-12 bg-[#004a8f] text-white flex items-center justify-between px-6 text-base font-bold shrink-0 border-b border-[#003566]">
                        <span>{center?.name || "Service Center"}</span>
                        <div className="flex items-center gap-2">
                            {connectionStatus !== "connected" && (
                                <button
                                    onClick={() => {
                                        setLoading(true);
                                        void reconnect();
                                        void fetchQueue();
                                    }}
                                    className="text-xs font-medium opacity-90 bg-black/20 px-3 py-1 rounded-full hover:bg-black/30"
                                >
                                    Manual Refresh
                                </button>
                            )}
                            <div className="flex items-center gap-2 text-sm font-medium opacity-80 bg-black/20 px-3 py-1 rounded-full">
                                <div className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                                {connectionStatus === "connected" ? "Live" : "Reconnecting"}
                            </div>
                        </div>
                    </div>

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar bg-gray-50/50">
                        {loading ? (
                            <div className="flex justify-center p-12"><div className="w-12 h-12 border-4 border-[#003d7b] border-t-[#f58220] rounded-full animate-spin"></div></div>
                        ) : waitingList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                                <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                <span className="text-xl font-medium">Queue is empty</span>
                            </div>
                        ) : (
                            waitingList.map((qPos, idx) => (
                                <div key={qPos.tokenId} className="flex items-center bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all group">
                                    <div className="w-11 h-11 rounded-full bg-blue-50 text-[#003d7b] flex items-center justify-center font-bold text-lg mr-4 shrink-0 group-hover:bg-[#003d7b] group-hover:text-white transition-colors">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-extrabold text-[#003d7b] text-base">Token {qPos.tokenNumber}</span>
                                            <span className="bg-orange-100 text-[#f58220] px-2 py-0.5 rounded-full text-xs font-bold tracking-widest uppercase">
                                                Waiting
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-gray-500 font-medium text-xs">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                Position #{qPos.position}
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                Est: {qPos.eta ? Math.ceil((new Date(qPos.eta).getTime() - Date.now()) / 60000) : "--"} min
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>

            <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
        </div>
    );
}
