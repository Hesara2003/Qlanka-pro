// frontend/src/components/officer/TokenActionButtons.tsx

import { useState } from "react";
import type { CalledTokenDto } from "../../api/counterApi";

interface Props {
    calledToken: CalledTokenDto | null;
    onServe: () => Promise<void>;
    onSkip: () => Promise<void>;
    serveLoading: boolean;
    skipLoading: boolean;
    serveError: string | null;
    skipError: string | null;
    serveRetryable: boolean;
    skipRetryable: boolean;
}

export default function TokenActionButtons({
    calledToken,
    onServe,
    onSkip,
    serveLoading,
    skipLoading,
    serveError,
    skipError,
    serveRetryable,
    skipRetryable,
}: Props) {
    const [confirmingAction, setConfirmingAction] = useState<"served" | "skipped" | null>(null);

    const noActiveToken = !calledToken;
    const disableServe = serveLoading || noActiveToken;
    const disableSkip = skipLoading || noActiveToken;
    const isLoading = serveLoading || skipLoading;

    const handleConfirm = async () => {
        if (confirmingAction === "served") {
            await onServe();
            setConfirmingAction(null);
            return;
        }

        if (confirmingAction === "skipped") {
            await onSkip();
            setConfirmingAction(null);
        }
    };

    return (
        <div className="bg-[#1a1c23] rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#78d64b] opacity-10 rounded-full blur-[80px]" />

            <div className="relative z-10 flex flex-col gap-6">
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Current Action</p>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Complete Current Token</h2>
                    <p className="text-[13px] text-gray-400 font-medium mt-2">
                        Mark token {calledToken?.tokenNumber ?? "-"} as served or skipped before calling the next token.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => setConfirmingAction("served")}
                        disabled={disableServe}
                        className="w-full flex items-center justify-center gap-3 py-5 bg-[#78d64b] hover:bg-[#68c63b] active:scale-[0.98] text-[#1a1c23] font-bold text-lg rounded-[2rem] shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                        {serveLoading ? (
                            <>
                                <span className="w-5 h-5 border-[3px] border-[#1a1c23]/30 border-t-[#78d64b] rounded-full animate-spin" />
                                Serving…
                            </>
                        ) : (
                            <>
                                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Serve
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => setConfirmingAction("skipped")}
                        disabled={disableSkip}
                        className="w-full flex items-center justify-center gap-3 py-5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-[#1a1c23] font-bold text-lg rounded-[2rem] shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                        {skipLoading ? (
                            <>
                                <span className="w-5 h-5 border-[3px] border-[#1a1c23]/30 border-t-[#78d64b] rounded-full animate-spin" />
                                Skipping…
                            </>
                        ) : (
                            <>
                                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5v14l11-7L8 5z" />
                                </svg>
                                Skip
                            </>
                        )}
                    </button>
                </div>

                {(serveError || skipError) && (
                    <div className="bg-[#1a1c23] border border-red-500/30 rounded-[2rem] p-4 text-center">
                        <p className="text-red-400 text-sm font-bold">{serveError ?? skipError}</p>
                        <div className="mt-3">
                            {serveError && serveRetryable && (
                                <button
                                    onClick={onServe}
                                    disabled={serveLoading || !calledToken}
                                    className="px-4 py-2 bg-[#78d64b] hover:bg-[#68c63b] text-[#1a1c23] rounded-full text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Retry Serve
                                </button>
                            )}
                            {skipError && skipRetryable && (
                                <button
                                    onClick={onSkip}
                                    disabled={skipLoading || !calledToken}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#1a1c23] rounded-full text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Retry Skip
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {confirmingAction && (
                    <div className="bg-[#1a1c23] border border-gray-800 rounded-[2rem] p-5 flex flex-col gap-3">
                        <p className="text-white text-sm font-bold">
                            {confirmingAction === "served"
                                ? `Confirm serving token ${calledToken?.tokenNumber ?? ""}?`
                                : `Confirm skipping token ${calledToken?.tokenNumber ?? ""}?`}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirm}
                                disabled={isLoading}
                                className="flex-1 py-3 bg-[#78d64b] hover:bg-[#68c63b] text-[#1a1c23] rounded-[2rem] font-bold shadow-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setConfirmingAction(null)}
                                disabled={isLoading}
                                className="flex-1 py-3 bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-[2rem] font-bold shadow-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
