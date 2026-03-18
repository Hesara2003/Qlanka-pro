// frontend/src/components/officer/ReassignTokenModal.tsx

import { useEffect, useMemo, useState } from "react";
import type { AvailableCounterDto, WaitingTokenDto } from "../../api/counterApi";

interface Props {
    token: WaitingTokenDto | null;
    availableCounters: AvailableCounterDto[];
    onConfirm: (targetCounterId: number, reason?: string) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    error: string | null;
}

export default function ReassignTokenModal({
    token,
    availableCounters,
    onConfirm,
    onCancel,
    loading,
    error,
}: Props) {
    const [targetCounterId, setTargetCounterId] = useState<number | null>(null);
    const [reason, setReason] = useState("");

    const tokenLabel = token?.tokenNumber ?? "";
    const canConfirm = !!targetCounterId && !loading;
    const showRetry = !!error && error.toLowerCase().includes("check your connection");

    const sortedCounters = useMemo(
        () => [...availableCounters].sort((a, b) => a.counterId - b.counterId),
        [availableCounters],
    );

    useEffect(() => {
        setTargetCounterId(null);
        setReason("");
    }, [token?.tokenId]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onCancel();
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [onCancel]);

    if (!token) {
        return null;
    }

    const handleConfirm = async () => {
        if (!targetCounterId) return;
        await onConfirm(targetCounterId, reason.trim() || undefined);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={onCancel}
            role="presentation"
        >
            <div
                className="w-full max-w-xl bg-[#1a1c23] rounded-[2rem] shadow-xl border border-gray-800 p-8"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`Reassign Token ${tokenLabel}`}
            >
                <div className="mb-6">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Token Reassignment</p>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Reassign Token {tokenLabel}</h2>
                </div>

                <div className="flex flex-col gap-5">
                    <div>
                        <label htmlFor="target-counter" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Target Counter
                        </label>
                        <select
                            id="target-counter"
                            value={targetCounterId ?? ""}
                            onChange={(event) => {
                                const value = event.target.value;
                                setTargetCounterId(value ? Number(value) : null);
                            }}
                            className="w-full bg-[#1a1c23] border border-gray-700 text-white rounded-[2rem] px-5 py-3.5 text-sm font-medium outline-none focus:border-[#78d64b]"
                        >
                            <option value="">Select an open counter</option>
                            {sortedCounters.map((counter) => (
                                <option key={counter.counterId} value={counter.counterId}>
                                    {counter.name || `Counter #${counter.counterId}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="reassign-reason" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Reason (Optional)
                        </label>
                        <input
                            id="reassign-reason"
                            type="text"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Enter reason for audit log"
                            className="w-full bg-[#1a1c23] border border-gray-700 text-white placeholder:text-gray-500 rounded-[2rem] px-5 py-3.5 text-sm font-medium outline-none focus:border-[#78d64b]"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-red-400 text-sm font-bold">{error}</p>
                            {showRetry && (
                                <button
                                    onClick={handleConfirm}
                                    disabled={!canConfirm}
                                    className="px-3 py-1.5 bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-full text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={handleConfirm}
                            disabled={!canConfirm}
                            className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#78d64b] hover:bg-[#68c63b] text-[#1a1c23] font-bold rounded-[2rem] shadow-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-[3px] border-[#1a1c23]/30 border-t-[#78d64b] rounded-full animate-spin" />
                                    Reassigning...
                                </>
                            ) : (
                                "Confirm Reassign"
                            )}
                        </button>

                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="w-full py-3.5 bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-[2rem] font-bold shadow-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
