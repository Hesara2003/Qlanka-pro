// frontend/src/pages/OfficerDashboardPage.tsx

import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCounter } from "../hooks/useCounter";
import { useQueueHub } from "../hooks/useQueueHub";
import CallNextButton from "../components/officer/CallNextButton";
import CurrentTokenDisplay from "../components/officer/CurrentTokenDisplay";
import TokenActionButtons from "../components/officer/TokenActionButtons";

export default function OfficerDashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const {
        calledToken,
        loading,
        error,
        errorCode,
        callNext,
        serveToken,
        skipToken,
        serveLoading,
        skipLoading,
        serveError,
        skipError,
        actionOutcome,
        clearActionOutcome,
        reset,
    } = useCounter(user?.counterId);
    const officerCenterId = (user as { centerId?: number } | null)?.centerId ?? calledToken?.centerId;
    const { connectionStatus } = useQueueHub(officerCenterId);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (!user) return <Navigate to="/login" replace />;

    if (user.counterId === undefined) {
        return (
            <div className="p-8">
                <div className="bg-[#1a1c23] rounded-[2rem] p-10 max-w-xl w-full shadow-2xl text-center mx-auto mt-10">
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
        <div className="p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#1a1c23] tracking-tight">Queue Management</h1>
                    <p className="text-gray-500 text-[14px] font-medium mt-1">
                        Call the next citizen in line at Counter #{user.counterId}.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 border border-gray-200">
                        <span
                            className={`w-2.5 h-2.5 rounded-full ${
                                connectionStatus === "connected" ? "bg-green-500" : "bg-gray-400"
                            }`}
                        />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            {connectionStatus === "connected" ? "Connected" : "Reconnecting"}
                        </span>
                    </div>
                </div>

                {(calledToken || error || actionOutcome) && (
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col gap-6">
                    {!calledToken && (
                        <CallNextButton
                            onCall={callNext}
                            loading={loading}
                            disabled={loading}
                        />
                    )}

                    {calledToken && (
                        <TokenActionButtons
                            calledToken={calledToken}
                            onServe={serveToken}
                            onSkip={skipToken}
                            serveLoading={serveLoading}
                            skipLoading={skipLoading}
                            serveError={serveError}
                            skipError={skipError}
                        />
                    )}

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

                <CurrentTokenDisplay
                    calledToken={calledToken}
                    loading={loading}
                    error={error}
                    errorCode={errorCode}
                    actionOutcome={actionOutcome}
                    onClearActionOutcome={clearActionOutcome}
                />
            </div>
        </div>
    );
}
