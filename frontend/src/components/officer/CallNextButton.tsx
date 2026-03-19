// frontend/src/components/officer/CallNextButton.tsx

interface Props {
    onCall: () => void;
    loading: boolean;
    disabled: boolean;
}

/**
 * Large "Call Next" action button for the officer workstation.
 * Matches the existing DashboardPage loading spinner and button styles exactly.
 */
export default function CallNextButton({ onCall, loading, disabled }: Props) {
    return (
        <div className="bg-[#1a1c23] rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#78d64b] opacity-10 rounded-full blur-[80px]" />

            <div className="relative z-10 flex flex-col gap-6">
                {/* Section label */}
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Action</p>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Call Next Token</h2>
                    <p className="text-[13px] text-gray-400 font-medium mt-2">
                        Calls the next waiting token in the queue and marks it as being served.
                    </p>
                </div>

                {/* The button */}
                <button
                    id="call-next-btn"
                    onClick={onCall}
                    disabled={disabled || loading}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-[#78d64b] hover:bg-[#68c63b] active:scale-[0.98] text-[#1a1c23] font-bold text-lg rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                    {loading ? (
                        <>
                            {/* Spinner — exact same style as DashboardPage loading state */}
                            <span className="w-5 h-5 border-[3px] border-[#1a1c23]/30 border-t-[#1a1c23] rounded-full animate-spin" />
                            Calling…
                        </>
                    ) : (
                        <>
                            {/* Bell icon */}
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Call Next
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
