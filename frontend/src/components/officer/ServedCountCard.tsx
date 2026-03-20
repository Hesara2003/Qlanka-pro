// frontend/src/components/officer/ServedCountCard.tsx

interface Props {
    servedCount: number;
    skippedCount: number;
    averageServiceTimeSeconds: number;
    loading: boolean;
    connectionStatus: "connected" | "reconnecting" | "disconnected";
}

function formatDuration(totalSeconds: number): string {
    const safe = Math.max(0, totalSeconds || 0);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}m ${seconds}s`;
}

export default function ServedCountCard({
    servedCount,
    skippedCount,
    averageServiceTimeSeconds,
    loading,
    connectionStatus,
}: Props) {
    if (loading) {
        return (
            <div className="bg-[#1a1c23] rounded-[2rem] shadow-xl p-8">
                <div className="animate-pulse">
                    <div className="h-3 w-28 bg-white/10 rounded mb-5" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-black/20 border border-gray-800 rounded-2xl p-5">
                            <div className="h-3 w-28 bg-white/10 rounded mb-3" />
                            <div className="h-9 w-20 bg-white/10 rounded" />
                        </div>
                        <div className="bg-black/20 border border-gray-800 rounded-2xl p-5">
                            <div className="h-3 w-24 bg-white/10 rounded mb-3" />
                            <div className="h-9 w-16 bg-white/10 rounded" />
                        </div>
                        <div className="bg-black/20 border border-gray-800 rounded-2xl p-5">
                            <div className="h-3 w-28 bg-white/10 rounded mb-3" />
                            <div className="h-9 w-24 bg-white/10 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#1a1c23] rounded-[2rem] shadow-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#78d64b] opacity-10 rounded-full blur-[80px]" />

            <div className="relative z-10">
                <div className="mb-5 flex items-center gap-2">
                    {connectionStatus === "connected" ? (
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#78d64b] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#78d64b]" />
                        </span>
                    ) : (
                        <span className="inline-flex rounded-full h-2.5 w-2.5 bg-gray-500" />
                    )}
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Today&apos;s Counter Stats</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/20 border border-gray-800 rounded-2xl p-5">
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Tokens Served Today</p>
                        <p className="mt-2 text-[#78d64b] text-4xl font-extrabold tracking-tight">{servedCount}</p>
                    </div>

                    <div className="bg-black/20 border border-gray-800 rounded-2xl p-5">
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Tokens Skipped</p>
                        <p className="mt-2 text-amber-400 text-4xl font-extrabold tracking-tight">{skippedCount}</p>
                    </div>

                    <div className="bg-black/20 border border-gray-800 rounded-2xl p-5">
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Avg Service Time</p>
                        <p className="mt-2 text-blue-400 text-4xl font-extrabold tracking-tight">{formatDuration(averageServiceTimeSeconds)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
