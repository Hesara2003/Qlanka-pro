import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getServiceCenterById } from "../api/serviceCenterApi";
import { bookToken } from "../api/appointmentApi";
import type { ServiceCenter } from "../types/serviceCenter";
import type { AppointmentResponseDto } from "../api/appointmentApi";
import { isAxiosError } from "axios";

export default function BookingPage() {
    const { centerId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [center, setCenter] = useState<ServiceCenter | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<AppointmentResponseDto | null>(null);

    useEffect(() => {
        // If user isn't logged in, redirect to login
        if (!user) {
            navigate("/login");
            return;
        }

        async function fetchCenter() {
            try {
                if (!centerId) return;
                const data = await getServiceCenterById(parseInt(centerId, 10));
                setCenter(data);
            } catch (err) {
                setError("Failed to load service center details.");
            } finally {
                setLoadingConfig(false);
            }
        }

        fetchCenter();
    }, [centerId, user, navigate]);

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">

                {/* Header */}
                <div className="mb-6">
                    <button onClick={() => navigate('/service-centers')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        Back to Centers
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Book a Token</h2>
                    {center && (
                        <p className="text-gray-600 mt-1">for <span className="font-semibold text-gray-900">{center.name}</span></p>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success View */}
                {successData ? (
                    <div className="text-center py-6">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                        <p className="text-gray-500 mb-6 mx-auto max-w-xs block">Present this token at the center to join the queue.</p>

                        <div className="bg-gray-100 rounded-lg p-6 mb-8 border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Your Token Number</p>
                            <p className="text-3xl font-mono font-bold text-blue-700">{successData.tokenNumber}</p>

                            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold mb-0.5">Date</p>
                                    <p className="text-sm font-medium text-gray-900">{new Date(successData.appointmentDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold mb-0.5">Time</p>
                                    <p className="text-sm font-medium text-gray-900">{successData.appointmentTime}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                ) : (
                    /* Booking Form */
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]} // Prevent past dates in UI
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Time</label>
                            <input
                                type="time"
                                required
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400"
                            />
                            {center && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Operating Hours: {center.openingTime} - {center.closingTime}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !date || !time}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                "Confirm Booking"
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
