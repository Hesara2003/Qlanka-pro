import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useServiceCenter } from "../hooks/useServiceCenters";
import { bookToken } from "../api/appointmentApi";
import type { AppointmentResponseDto } from "../api/appointmentApi";
import { isAxiosError } from "axios";

export default function BookingPage() {
    const { centerId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // SCRUM-68: use shared hook for service center data instead of raw API call
    const centerIdNum = centerId ? parseInt(centerId, 10) : 0;
    const {
        center,
        loading: loadingConfig,
        error: centerError,
    } = useServiceCenter(centerIdNum);

    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<AppointmentResponseDto | null>(null);

    // Auth guard — redirect to login if unauthenticated; admins have no booking flow
    useEffect(() => {
        if (!user) {
            navigate("/login");
        } else if (user.role === "admin") {
            navigate("/service-centers", { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!centerId || !date || !time) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Ensure time matches HH:mm:ss for backend TimeSpan parsing
            const formattedTime = time.length === 5 ? `${time}:00` : time;

            const response = await bookToken({
                centerId: parseInt(centerId, 10),
                appointmentDate: new Date(date).toISOString(),
                appointmentTime: formattedTime
            });

            setSuccessData(response);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.message || "An unexpected error occurred while booking.");
            } else {
                setError("Failed to connect to the server.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingConfig) {
        return (
            <div className="w-full flex items-center justify-center p-20">
                <div className="flex flex-col items-center gap-4 bg-white p-12 rounded-3xl border border-gray-100 border-dashed shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
                    <p className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">Preparing Booking System...</p>
                </div>
            </div>
        );
    }

    // SCRUM-68: surface center-load errors (e.g. invalid ID, network failure) before rendering form
    if (centerError || !center) {
        return (
            <div className="w-full flex items-center justify-center p-4 pt-12">
                <div className="bg-red-50 rounded-3xl border border-red-100 p-10 max-w-md w-full text-center shadow-sm">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-800 font-extrabold text-lg mb-2">Service Center Unavailable</p>
                    <p className="text-red-600 text-[14px] font-medium mb-8 leading-relaxed">
                        {centerError || "We couldn't find the service center you were looking for."}
                    </p>
                    <button
                        onClick={() => navigate("/service-centers")}
                        className="px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors font-bold shadow-md shadow-red-500/20 active:scale-95"
                    >
                        Back to Centers
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full pt-10 pb-20 px-4">
            <div className="max-w-[480px] mx-auto bg-white rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden relative">

                {/* Decorative background for the header */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50" />

                <div className="p-8 relative z-10">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/service-centers')}
                            className="group text-sm font-bold text-gray-500 hover:text-black mb-6 inline-flex items-center gap-1.5 transition-colors"
                        >
                            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            Back to Centers
                        </button>

                        <div className="flex items-start gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-extrabold shadow-sm shrink-0">
                                {center.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none mb-1">Book a Token</h2>
                                <p className="text-[14px] font-medium text-gray-500 line-clamp-1">Service center: <span className="text-gray-900 font-bold">{center.name}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
                            <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-[13px] font-semibold text-red-700 leading-snug">{error}</p>
                        </div>
                    )}

                    {/* Success View */}
                    {successData ? (
                        <div className="text-center py-4">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-6 relative">
                                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-50" />
                                <svg className="h-10 w-10 text-emerald-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Booking Confirmed!</h3>
                            <p className="text-[14px] font-medium text-gray-500 mb-8 mx-auto max-w-xs">
                                Present this token number at the center when you arrive to be served.
                            </p>

                            <div className="bg-gray-50 rounded-3xl p-6 mb-8 border border-gray-100 relative overflow-hidden">
                                {/* Diagonal cut effect for ticket feel */}
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-r border-gray-100" />
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-l border-gray-100" />

                                <p className="text-[11px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Your Token Number</p>
                                <p className="text-[40px] leading-none font-bold text-gray-900 tracking-tighter mb-6">
                                    {successData.tokenNumber}
                                </p>

                                <div className="border-t border-dashed border-gray-300 pt-5 grid grid-cols-2 gap-4 text-left">
                                    <div>
                                        <p className="text-[11px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Date</p>
                                        <p className="text-[15px] font-bold text-gray-900">
                                            {new Date(successData.appointmentDate).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Time</p>
                                        <p className="text-[15px] font-bold text-gray-900 text-right">
                                            {successData.appointmentTime}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-black text-white hover:bg-gray-900 rounded-2xl px-4 py-4 font-bold tracking-wide transition-all duration-200 shadow-lg shadow-black/10 active:scale-95"
                            >
                                Go to My Tickets
                            </button>
                        </div>
                    ) : (
                        /* Booking Form */
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-2">Select Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black focus:bg-white outline-none text-gray-900 font-semibold transition-all appearance-none"
                                        style={{ WebkitAppearance: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-2">Select Time</label>
                                <div className="relative">
                                    <input
                                        type="time"
                                        required
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black focus:bg-white outline-none text-gray-900 font-semibold transition-all appearance-none"
                                        style={{ WebkitAppearance: 'none' }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-3 text-[12px] font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Center Hours: {center.openingTime} - {center.closingTime}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !date || !time}
                                className="w-full mt-8 flex justify-center py-4 px-4 rounded-2xl text-[15px] font-bold tracking-wide text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black disabled:active:scale-100"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Confirming...</span>
                                    </div>
                                ) : (
                                    "Confirm Booking"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
