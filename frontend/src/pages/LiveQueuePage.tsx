import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tokenApi } from "../api/tokenApi";
import type { QueuePositionDto } from "../api/tokenApi";
import { useServiceCenter } from "../hooks/useServiceCenters";

export default function LiveQueuePage() {
    const { centerId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const centerIdNum = centerId ? parseInt(centerId, 10) : 0;
    const { center } = useServiceCenter(centerIdNum);

    const [queue, setQueue] = useState<QueuePositionDto[]>([]);
    const [loading, setLoading] = useState(true);

    // Simulate current serving data based on the top of the queue or mock data if empty
    const currentServing = queue.length > 0 ? queue[0] : null;
    const waitingList = queue.slice(1);

    // Mock timer state for "Serving Time"
    const [servingTime, setServingTime] = useState(0);

    // Fetch live queue data
    useEffect(() => {
        const fetchQueue = async () => {
            if (!centerIdNum) return;
            try {
                const data = await tokenApi.getServiceCenterQueue(centerIdNum);
                setQueue(data);
            } catch (error) {
                console.error("Failed to fetch queue", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQueue();
        const interval = setInterval(fetchQueue, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, [centerIdNum]);

    // Serving time counter effect
    useEffect(() => {
        const timer = setInterval(() => {
            setServingTime(prev => prev + 1);
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
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
        <div className="min-h-screen bg-black p-4 md:p-8 flex items-center justify-center font-sans">
            {/* Tablet Frame Wrapper */}
            <div className="w-full max-w-[1280px] bg-[#f0f2f5] rounded-xl overflow-hidden shadow-2xl flex flex-col aspect-[4/3] max-h-[90vh]">

                {/* Header Navbar */}
                <div className="h-16 bg-[#003d7b] flex items-center justify-between px-6 text-white shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Mock Logo placeholder */}
                        <div className="bg-white rounded p-1">
                            <div className="font-bold text-[#003d7b] tracking-wider text-sm flex items-center">
                                <span className="text-orange-500 mr-1">Q</span>LANKA
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-[#003d7b] font-bold overflow-hidden">
                                {user?.username?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <span className="text-sm font-medium">{user?.username || "Guest User"}</span>
                        </div>
                        <div className="h-8 w-px bg-[#ffffff33]"></div>
                        <div className="text-xs text-right leading-tight opacity-90">
                            <div>{dateStr}</div>
                            <div>{timeStr}</div>
                        </div>
                        <div className="h-8 w-px bg-[#ffffff33]"></div>
                        <button onClick={() => navigate(-1)} className="hover:opacity-80 transition-opacity">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                    </div>
                </div>

                {/* Main Content Area - 3 Columns */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left Column: Current Monitor */}
                    <div className="w-5/12 bg-white flex flex-col p-8 border-r border-gray-200">
                        <div className="flex-1 flex flex-col items-center justify-center pb-8 border-b border-gray-100">
                            <h2 className="text-[#f58220] font-bold text-xl mb-4">Current Serving</h2>
                            <h1 className="text-[#003d7b] font-bold text-3xl mb-8">Token Number</h1>

                            {/* Giant Orange Token Display Box */}
                            <div className="border-4 border-[#f58220] rounded-2xl w-full max-w-[320px] aspect-[4/3] flex items-center justify-center shadow-sm mb-12">
                                <span className="text-[#f58220] text-8xl md:text-[140px] font-bold tracking-tighter">
                                    {currentServing ? currentServing.tokenNumber : "---"}
                                </span>
                            </div>

                            <h3 className="text-[#003d7b] font-bold text-xl mb-2">Serving Time</h3>
                            <div className="text-[#003d7b] font-bold text-5xl tracking-widest font-mono">
                                {currentServing ? formatTime(servingTime) : "00:00:00"}
                            </div>
                        </div>

                        {/* Footer Stats Row */}
                        <div className="h-24 flex items-center justify-center gap-12 shrink-0 pt-4">
                            <div className="text-center">
                                <p className="text-[#003d7b] font-semibold text-sm mb-1">Total Served Tokens</p>
                                <p className="text-[#f58220] font-bold text-3xl">{queue.length * 5 + 10} {/* Mocked multiplier for scale */}</p>
                            </div>
                            <div className="w-px h-12 bg-gray-200"></div>
                            <div className="text-center">
                                <p className="text-[#003d7b] font-semibold text-sm mb-1">Performance Status</p>
                                <p className="text-[#f58220] font-bold text-2xl">Excellent</p>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Action Buttons */}
                    <div className="w-3/12 bg-[#f8f9fa] p-6 flex flex-col gap-4 border-r border-gray-200">
                        {['Next', 'Call', 'Recall', 'Transfer', 'Start', 'Close'].map((actionText) => (
                            <button
                                key={actionText}
                                className="flex-1 bg-[#004a8f] hover:bg-[#003566] text-white font-bold text-lg rounded-md shadow-md transition-colors active:scale-[0.98]"
                            >
                                {actionText}
                            </button>
                        ))}
                    </div>

                    {/* Right Column: Waiting List */}
                    <div className="w-4/12 bg-white flex flex-col">
                        <div className="h-10 bg-[#f58220] text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {waitingList.length} visitors are waiting
                        </div>
                        <div className="h-10 bg-[#004a8f] text-white flex items-center justify-center font-bold text-sm shrink-0 border-b border-[#003566]">
                            {center?.name || "Department"}
                        </div>

                        {/* Scrollable list */}
                        <div className="flex-1 overflow-y-auto px-1 py-2 space-y-2 custom-scrollbar">
                            {loading ? (
                                <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-[#f58220] border-t-transparent rounded-full animate-spin"></div></div>
                            ) : waitingList.length === 0 ? (
                                <div className="text-center text-gray-400 p-8 font-medium">No one is waiting</div>
                            ) : (
                                waitingList.map((qPos, idx) => (
                                    <div key={qPos.tokenId} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#003d7b] text-lg">Visitor {idx + 1}</span>
                                            <span className="text-gray-500 text-sm font-medium">Token: {qPos.tokenNumber}</span>
                                            <span className="text-[#f58220] text-xs font-bold mt-1 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                Pos: {qPos.position}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end opacity-60">
                                            <svg className="w-5 h-5 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span className="text-gray-600 text-sm font-medium">{qPos.eta ? Math.ceil(new Date(qPos.eta).getTime() - Date.now() / 60000) : "--"} min</span>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Decorative bottom labels from mockup */}
                            {!loading && waitingList.length > 0 && (
                                <div className="flex items-center justify-center gap-2 p-4 pt-8">
                                    <span className="px-3 py-1 bg-green-500 text-white text-[10px] rounded font-bold">Label 1</span>
                                    <span className="px-3 py-1 bg-orange-500 text-white text-[10px] rounded font-bold">Label 2</span>
                                    <span className="px-3 py-1 bg-blue-500 text-white text-[10px] rounded font-bold">Label 3</span>
                                    <span className="px-3 py-1 bg-red-500 text-white text-[10px] rounded font-bold">Label 4</span>
                                </div>
                            )}
                        </div>

                        {/* Bottom action button */}
                        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                            <button className="w-full bg-[#004a8f] hover:bg-[#003566] text-white font-bold py-3.5 rounded-md shadow transition-colors text-lg">
                                Add Visitor
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}
