// frontend/src/components/officer/WaitingTokensList.tsx

import { useEffect, useState } from "react";
import type { WaitingTokenDto } from "../../api/counterApi";
import type { TokenReassignedPayload } from "../../hooks/useQueueHub";

interface Props {
    tokens: WaitingTokenDto[];
    loading: boolean;
    onReassignClick: (token: WaitingTokenDto) => void;
    latestReassignment: TokenReassignedPayload | null;
    currentCounterId: number;
}

function formatIssuedTime(issuedTime: string): string {
    return new Date(issuedTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function WaitingTokensList({
    tokens,
    loading,
    onReassignClick,
    latestReassignment,
    currentCounterId,
}: Props) {
    const [fadingTokenId, setFadingTokenId] = useState<number | null>(null);
    const [highlightTokenId, setHighlightTokenId] = useState<number | null>(null);

    useEffect(() => {
        if (!latestReassignment) return;

        if (latestReassignment.sourceCounterId === currentCounterId) {
            setFadingTokenId(latestReassignment.tokenId);
            const fadeTimeout = window.setTimeout(() => {
                setFadingTokenId(null);
            }, 260);

            return () => window.clearTimeout(fadeTimeout);
        }

        if (latestReassignment.targetCounterId === currentCounterId) {
            setHighlightTokenId(latestReassignment.tokenId);
            const highlightTimeout = window.setTimeout(() => {
                setHighlightTokenId(null);
            }, 2000);

            return () => window.clearTimeout(highlightTimeout);
        }
    }, [latestReassignment, currentCounterId]);

    return (
        <div className="bg-[#1a1c23] rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#78d64b] opacity-10 rounded-full blur-[80px]" />

            <div className="relative z-10">
                <div className="mb-5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Waiting Queue</p>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Waiting Tokens</h2>
                </div>

                {loading ? (
                    <div className="min-h-[180px] flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-gray-800 border-t-[#78d64b] rounded-full animate-spin" />
                    </div>
                ) : tokens.length === 0 ? (
                    <div className="min-h-[180px] flex flex-col items-center justify-center gap-3 text-center">
                        <svg className="w-14 h-14 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" />
                        </svg>
                        <p className="text-gray-400 text-sm font-bold">No tokens waiting</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {tokens.map((token) => (
                            <div
                                key={token.tokenId}
                                className={`bg-black/20 border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-3 transition-all duration-300 ${
                                    token.tokenId === fadingTokenId ? "opacity-0 -translate-x-2" : "opacity-100 translate-x-0"
                                } ${token.tokenId === highlightTokenId ? "bg-amber-500/10" : ""}`}
                            >
                                <div className="min-w-0">
                                    <p className="text-white font-bold text-base tracking-tight">{token.tokenNumber}</p>
                                    <p className="text-gray-400 text-xs font-medium mt-0.5">
                                        Position #{token.queuePosition ?? "-"} · Issued {formatIssuedTime(token.issuedTime)}
                                    </p>
                                </div>

                                <button
                                    onClick={() => onReassignClick(token)}
                                    className="px-3.5 py-2 text-xs font-bold rounded-full border border-amber-500 text-amber-500 hover:bg-amber-500/10 transition-colors"
                                >
                                    Reassign
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
