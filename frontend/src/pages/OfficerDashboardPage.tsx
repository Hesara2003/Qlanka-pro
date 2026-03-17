// frontend/src/pages/OfficerDashboardPage.tsx

import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCounter } from "../hooks/useCounter";
import CallNextButton from "../components/officer/CallNextButton";
import CurrentTokenDisplay from "../components/officer/CurrentTokenDisplay";

export default function OfficerDashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Hooks must always be called unconditionally — before any early returns.
    // useCounter safely handles `undefined` counterId (no-ops on callNext).
    const { calledToken, loading, error, errorCode, callNext, reset } = useCounter(user?.counterId);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Guard — should not be reachable without auth (OfficerRoute handles it).
    if (!user) return <Navigate to="/login" replace />;

    // ── No counter configured ─────────────────────────────────────────────────
    if (user.counterId === undefined) {
        return (
            <div className="flex h-screen bg-[#f8f9fb] font-sans items-center justify-center">
                <div className="bg-[#1a1c23] rounded-[2rem] p-12 max-w-md w-full mx-4 shadow-2xl text-center">
                    <svg className="w-16 h-16 text-amber-400 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-white text-2xl font-bold tracking-tight mb-2">Counter Not Configured</h2>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">
                        Your account does not have a counter assigned. Please contact an administrator to link your account to a counter.
                    </p>
                    <button
                        onClick={handleLogout}
                        className="mt-8 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold rounded-full transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#f8f9fb] font-sans overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between py-6 px-4">
                <div>
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-8 h-8 bg-[#78d64b] rounded-lg flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-sm" />
                        </div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight">QueueLanka</span>
                    </div>

                    {/* Nav */}
                    <div className="mb-8">
                        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Officer Menu</p>
                        <nav className="flex flex-col gap-1">
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 text-gray-900 font-bold shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                Workstation
                            </div>
                        </nav>
                    </div>

                    {/* Counter info card */}
                    <div className="bg-[#78d64b]/10 border border-[#78d64b]/20 rounded-2xl px-4 py-4">
                        <p className="text-[10px] font-bold text-[#0a5c4e] uppercase tracking-widest mb-1">Assigned Counter</p>
                        <p className="text-2xl font-extrabold text-[#1a1c23] tracking-tight">#{user.counterId}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="border-t border-gray-100 pt-4">
                    {/* User pill */}
                    <div className="flex items-center gap-2 px-3 py-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                            {user.username[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 leading-none truncate">{user.username}</p>
                            <p className="text-[10px] text-gray-400 font-medium capitalize leading-none mt-0.5">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-gray-500 hover:text-red-600 px-3 py-2.5 rounded-xl font-medium transition-colors w-full text-left text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log Out
                    </button>
                </div>
            </aside>

            {/* ── Main column ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Top bar */}
                <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-8 h-16 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-[15px] font-bold text-gray-900 leading-none">Officer Workstation</h2>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5 leading-none hidden sm:block">
                            Counter #{user.counterId} — Queue management
                        </p>
                    </div>

                    {/* Reset button (shown only when something was called or errored) */}
                    {(calledToken || error) && (
                        <button
                            onClick={reset}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 border-none text-white text-xs font-bold rounded-full hover:bg-gray-700 transition-colors shadow-sm"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset
                        </button>
                    )}
                </header>

                {/* Scrollable content */}
                <main className="flex-1 overflow-y-auto p-8">

                    {/* Page header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-[#1a1c23] tracking-tight">Queue Management</h1>
                        <p className="text-gray-500 text-[14px] font-medium mt-1">
                            Call the next citizen in line at Counter #{user.counterId}.
                        </p>
                    </div>

                    {/* Two-column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Call Next action */}
                        <div className="flex flex-col gap-6">
                            <CallNextButton
                                onCall={callNext}
                                loading={loading}
                                disabled={loading}
                            />

                            {/* Instructions card */}
                            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">How It Works</p>
                                <div className="flex flex-col gap-3">
                                    {[
                                        { step: "1", text: "Press Call Next to pull the first waiting token from the queue." },
                                        { step: "2", text: "The token number appears on the right — announce it to the public display." },
                                        { step: "3", text: "Once the citizen is served, press Call Next again for the next person." },
                                    ].map(({ step, text }) => (
                                        <div key={step} className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-[#78d64b] text-[#1a1c23] text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                                                {step}
                                            </span>
                                            <p className="text-gray-600 text-sm font-medium leading-relaxed">{text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Current token display */}
                        <CurrentTokenDisplay
                            calledToken={calledToken}
                            loading={loading}
                            error={error}
                            errorCode={errorCode}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}
