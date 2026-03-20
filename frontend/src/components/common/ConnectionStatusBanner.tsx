// frontend/src/components/common/ConnectionStatusBanner.tsx

interface Props {
    connectionStatus: "connected" | "reconnecting" | "disconnected";
    onManualRefresh: () => void;
}

export default function ConnectionStatusBanner({ connectionStatus, onManualRefresh }: Props) {
    if (connectionStatus === "connected") {
        return null;
    }

    if (connectionStatus === "reconnecting") {
        return (
            <div className="w-full rounded-lg bg-amber-500/20 border-b border-amber-500 text-amber-400 px-4 py-2 text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                    <span>Reconnecting to live updates...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full rounded-lg bg-red-500/20 border-b border-red-500 text-red-400 px-4 py-2 text-sm font-medium flex items-center justify-between">
            <span>Live updates unavailable</span>
            <button
                type="button"
                onClick={onManualRefresh}
                className="px-3 py-1 rounded-full bg-red-500/30 text-red-100 hover:bg-red-500/40 text-xs font-semibold"
            >
                Refresh
            </button>
        </div>
    );
}
