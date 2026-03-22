// frontend/src/components/officer/CurrentTokenDisplay.tsx

import { useEffect, useRef } from "react";
import type { CalledTokenDto, CallNextErrorCode } from "../../api/counterApi";
import type { DashboardCurrentTokenDto } from "../../api/counterApi";
import type { TokenActionOutcome } from "../../hooks/useCounter";

interface Props {
    calledToken: CalledTokenDto | null;
    currentToken: DashboardCurrentTokenDto | null;
    loading: boolean;
    error: string | null;
    errorCode: CallNextErrorCode | null;
    actionOutcome: TokenActionOutcome | null;
    onClearActionOutcome: () => void;
}

function formatTime(dateString?: string | null): string {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateString?: string | null): string {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleDateString(undefined, {
        weekday: "short", year: "numeric", month: "short", day: "numeric",
    });
}

/**
 * Displays the current token being served at a counter.
 * Handles idle, loading, success, and two error states (no tokens / counter closed).
 */
export default function CurrentTokenDisplay({
    calledToken,
    currentToken,
    loading,
    error,
    errorCode,
    actionOutcome,
    onClearActionOutcome,
}: Props) {
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!actionOutcome) return;

        timeoutRef.current = window.setTimeout(() => {
            onClearActionOutcome();
        }, 3000);

        return () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [actionOutcome, onClearActionOutcome]);

    const displayToken = calledToken;
    const hydratedToken = currentToken;

    // ── Loading state ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="bg-[#1a1c23] rounded-[2rem] border border-gray-800 shadow-xl p-12 flex flex-col items-center justify-center gap-4 min-h-[320px]">
                {/* Spinner — matches DashboardPage exactly */}
                <div className="w-10 h-10 border-4 border-gray-800 border-t-[#78d64b] rounded-full animate-spin" />
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                    Calling next token…
                </p>
            </div>
        );
    }

    // ── Error: no waiting tokens (404) ────────────────────────────────────────
    if (errorCode === "NO_WAITING_TOKENS") {
        return (
            <div className="bg-[#1a1c23] rounded-[2rem] border border-amber-500/20 shadow-xl p-10 flex flex-col items-center justify-center gap-4 min-h-[320px] text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg tracking-tight">No Tokens Waiting</h3>
                    <p className="text-gray-400 text-sm font-medium mt-1">
                        There are no waiting tokens in the queue right now. Check back shortly.
                    </p>
                </div>
            </div>
        );
    }

    // ── Error: counter closed (400) ───────────────────────────────────────────
    if (errorCode === "COUNTER_CLOSED") {
        return (
            <div className="bg-[#1a1c23] rounded-[2rem] border border-red-500/20 shadow-xl p-10 flex flex-col items-center justify-center gap-4 min-h-[320px] text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-red-400 font-bold text-lg tracking-tight">Counter Is Closed</h3>
                    <p className="text-gray-400 text-sm font-medium mt-1">
                        {error ?? "This counter is currently closed. Please open the counter before calling tokens."}
                    </p>
                </div>
            </div>
        );
    }

    // ── Generic error state ───────────────────────────────────────────────────
    if (error) {
        return (
            <div className="bg-[#1a1c23] border border-red-500/20 text-red-400 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-3 min-h-[320px] text-center shadow-xl">
                <svg className="w-10 h-10 text-red-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <h3 className="font-bold text-[17px] mb-1">Something Went Wrong</h3>
                    <p className="text-[13px] font-bold text-red-500/70">{error}</p>
                </div>
            </div>
        );
    }

    // ── Outcome: token served/skipped ────────────────────────────────────────
    if (actionOutcome?.status === "served") {
        return (
            <div className="bg-[#1a1c23] rounded-[2rem] border border-[#78d64b]/30 shadow-xl p-10 flex flex-col items-center justify-center gap-4 min-h-[320px] text-center">
                <div className="w-16 h-16 rounded-full bg-[#78d64b]/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#78d64b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-[#78d64b] font-bold text-lg tracking-tight">Token {actionOutcome.tokenNumber} served successfully</h3>
                    <p className="text-gray-400 text-sm font-medium mt-1">Ready to serve the next token.</p>
                </div>
            </div>
        );
    }

    if (actionOutcome?.status === "skipped") {
        return (
            <div className="bg-[#1a1c23] rounded-[2rem] border border-amber-500/30 shadow-xl p-10 flex flex-col items-center justify-center gap-4 min-h-[320px] text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5v14l11-7L8 5z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-amber-400 font-bold text-lg tracking-tight">Token {actionOutcome.tokenNumber} skipped</h3>
                    <p className="text-gray-400 text-sm font-medium mt-1">Ready to serve the next token.</p>
                </div>
            </div>
        );
    }

    // ── Success: token was called ─────────────────────────────────────────────
    if (displayToken || hydratedToken) {
        const tokenId = displayToken?.tokenId ?? hydratedToken?.tokenId ?? 0;
        const tokenNumber = displayToken?.tokenNumber ?? hydratedToken?.tokenNumber ?? "-";
        const status = displayToken?.status ?? hydratedToken?.status ?? "Waiting";
        const calledAt = displayToken?.calledAt ?? hydratedToken?.calledAt ?? null;
        const issuedDate = displayToken?.issuedDate ?? null;
        const issuedTime = displayToken?.issuedTime ?? null;

        return (
            <div className="bg-[#1a1c23] rounded-[2rem] border border-gray-800 shadow-xl overflow-hidden relative">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-[5px] bg-[#78d64b] rounded-t-[2rem]" />

                <div className="p-8 flex flex-col gap-6 pt-10">
                    {/* Label */}
                    <div>
                        <p className="text-[10px] font-bold text-[#78d64b] uppercase tracking-widest mb-1">Now Serving</p>
                        <h3 className="text-white text-lg font-bold tracking-tight">Token Called Successfully</h3>
                    </div>

                    {/* Token number — hero display matching UserTokenCard */}
                    <div className="text-center py-4 bg-black/30 rounded-2xl border border-gray-800">
                        <p className="text-[#78d64b] text-xs uppercase tracking-widest font-bold mb-2">Token Number</p>
                        <h2 className="text-7xl text-white font-extrabold font-mono tracking-tight">
                            {tokenNumber}
                        </h2>
                        <div className="mt-4">
                            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-blue-500 text-white">
                                {status}
                            </span>
                        </div>
                    </div>

                    {/* Metadata row */}
                    <div className="grid grid-cols-2 gap-4 bg-black/20 rounded-2xl p-4 border border-gray-800">
                        <div>
                            <p className="text-gray-500 text-xs font-semibold">Called At</p>
                            <p className="mt-1 text-white text-sm font-bold">{formatTime(calledAt)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold">Issued Date</p>
                            <p className="mt-1 text-white text-sm font-bold">{formatDate(issuedDate)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold">Issued Time</p>
                            <p className="mt-1 text-white text-sm font-bold">{formatTime(issuedTime)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold">Token ID</p>
                            <p className="mt-1 text-gray-400 text-sm font-bold">#{tokenId}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Idle: nothing called yet ───────────────────────────────────────────────
    return (
        <div className="bg-[#1a1c23] rounded-[2rem] border border-gray-800 border-dashed shadow-xl p-12 flex flex-col items-center justify-center gap-4 min-h-[320px] text-center">
            <svg className="w-16 h-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div>
                <h3 className="font-bold text-[18px] text-white tracking-tight mb-1">Ready to Serve</h3>
                <p className="text-[13px] text-gray-500 font-medium">
                    Press <span className="text-[#78d64b] font-bold">Call Next</span> to serve the next person in the queue.
                </p>
            </div>
        </div>
    );
}
