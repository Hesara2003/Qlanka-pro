import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useServiceCenter } from "../hooks/useServiceCenters";
import { bookToken } from "../api/appointmentApi";
import type { AppointmentResponseDto } from "../api/appointmentApi";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";

export default function BookingPage() {
    const { centerId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

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

    // SCRUM-70: Generate next 7 days for quick selection
    const availableDates = useMemo(() => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, []);

    // SCRUM-70: Generate 30-minute time slots based on center hours
    const timeSlots = useMemo(() => {
        if (!center) return [];
        const [startH, startM] = center.openingTime.split(':').map(Number);
        const [endH, endM] = center.closingTime.split(':').map(Number);
        
        const slots = [];
        let currH = startH;
        let currM = startM;

        while (currH < endH || (currH === endH && currM < endM)) {
            const h = currH.toString().padStart(2, '0');
            const m = currM.toString().padStart(2, '0');
            slots.push(`${h}:${m}`);
            
            currM += 30;
            if (currM >= 60) {
                currM -= 60;
                currH += 1;
            }
        }
        return slots;
    }, [center]);

    useEffect(() => {
        if (!user) {
            navigate("/login");
        } else if (user.role === "admin") {
            navigate("/service-centers", { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!centerId || !date || !time) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const formattedTime = time.length === 5 ? `${time}:00` : time;
            const response = await bookToken({
                centerId: parseInt(centerId, 10),
                appointmentDate: date,
                appointmentTime: formattedTime
            });
            setSuccessData(response);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
                <div className="flex flex-col items-center gap-4 bg-white p-12 rounded-3xl border border-gray-100 border-dashed animate-pulse">
                    <div className="w-12 h-12 border-4 border-gray-100 border-t-[#78d64b] rounded-full animate-spin" />
                    <p className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">Opening Hub Access...</p>
                </div>
            </div>
        );
    }

    if (centerError || !center) {
        return (
            <div className="w-full flex items-center justify-center p-4 pt-12">
                <div className="bg-red-50 rounded-3xl border border-red-100 p-10 max-w-md w-full text-center shadow-sm">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-800 font-extrabold text-lg mb-2">Location Not Found</p>
                    <p className="text-red-600 text-[14px] font-medium mb-8 leading-relaxed">
                        Something went wrong while looking for this location.
                    </p>
                    <button onClick={() => navigate("/service-centers")} className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold shadow-md shadow-red-500/20 active:scale-95">Back to Directory</button>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full max-w-[1400px] mx-auto py-4 text-gray-900 selection:bg-[#78d64b]/30 h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
            
            <div className="mb-6 flex items-center justify-between px-2 shrink-0">
                <button
                    onClick={() => navigate('/service-centers')}
                    className="group flex items-center gap-4 px-6 py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 shadow-sm transition-all active:scale-95"
                >
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M15 18l-7-7 7-7" /></svg>
                    Back to Directory
                </button>
                <div className="bg-gray-100/50 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#78d64b] animate-pulse" />
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Authorization Verified</span>
                </div>
            </div>

            {successData ? (
                /* YOUR TICKET - SUCCESS STATE (FIXED) */
                <div className="flex-1 flex items-center justify-center overflow-hidden py-4 lg:py-8">
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[3rem] p-6 lg:p-10 shadow-2xl border border-gray-100 max-w-2xl w-full relative overflow-hidden text-center scale-95 lg:scale-100"
                     >
                         <div className="relative z-10">
                            <div className="mx-auto w-12 h-12 bg-[#78d64b]/10 rounded-xl flex items-center justify-center text-[#78d64b] mb-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                            </div>

                            <h2 className="text-2xl lg:text-4xl font-medium tracking-tighter mb-1 leading-none">
                                Booking <span className="italic" style={{ fontFamily: "'Playfair Display', serif" }}>Confirmed</span>
                            </h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest max-w-sm mx-auto mb-6 opacity-80">
                                Your ticket is ready. Show this number when you arrive.
                            </p>

                            <div className="bg-gray-50 rounded-[2rem] p-6 lg:p-8 mb-8 border border-gray-100 relative shadow-inner">
                                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-r border-gray-100" />
                                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-l border-gray-100" />
                                
                                <span className="text-[8px] font-black text-[#78d64b] uppercase tracking-[0.4em] italic mb-3 block">TICKET NUMBER</span>
                                <div className="text-3xl lg:text-5xl font-black text-gray-900 tracking-tighter leading-tight mb-8 break-all">
                                    {successData.tokenNumber}
                                </div>

                                <div className="grid grid-cols-3 gap-4 border-t border-dashed border-gray-200 pt-6 text-left">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Location</span>
                                        <p className="text-[10px] font-black text-gray-900 truncate">{center.name}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Date</span>
                                        <p className="text-[10px] font-black text-gray-900">
                                            {new Date(successData.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Arrival</span>
                                        <p className="text-[10px] font-black text-gray-900">{successData.appointmentTime}</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => navigate('/dashboard')} className="px-10 py-4 bg-gray-900 text-white text-[9px] font-black rounded-xl hover:bg-black transition-all shadow-xl uppercase tracking-widest">Go to My Dashboard</button>
                         </div>
                     </motion.div>
                </div>
            ) : (
                /* BOOK YOUR VISIT */
                <div className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-0 items-center overflow-hidden">
                    
                    <div className="flex-1 flex flex-col justify-center min-w-0 py-2">
                        <div className="max-w-xl">
                            <div className="mb-6">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] italic mb-3 block opacity-60">Booking your visit</span>
                                <h1 className="text-4xl lg:text-5xl font-medium tracking-tighter leading-[1] text-gray-900">
                                        Visit<br /> 
                                        <span className="italic" style={{ fontFamily: "'Playfair Display', serif" }}>{center.name}</span>
                                </h1>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-8">
                                <div className="bg-white border border-gray-100 p-4 lg:p-6 rounded-[2rem] shadow-sm">
                                     <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest italic mb-2 block">HOURS</span>
                                     <p className="text-sm font-black text-gray-900">{center.openingTime} — {center.closingTime}</p>
                                </div>
                                <div className="bg-white border border-gray-100 p-4 lg:p-6 rounded-[2rem] shadow-sm">
                                     <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest italic mb-2 block">WAIT TIME</span>
                                     <p className="text-sm font-black text-gray-900">~{center.averageServiceTimeMinutes} mins</p>
                                </div>
                            </div>

                            <p className="text-base text-gray-500 font-medium tracking-tight leading-relaxed max-w-sm">
                                Select a date and time that works for you. We'll have everything ready.
                            </p>
                        </div>
                    </div>

                    <div className="w-full lg:max-w-md flex flex-col justify-center py-2 h-full min-h-0">
                        <div className="bg-white rounded-[3rem] p-6 lg:p-8 shadow-premium border border-gray-100 flex flex-col h-full max-h-[600px]">
                            
                            <div className="mb-6 shrink-0">
                                <h3 className="text-lg font-black text-gray-900 tracking-tighter italic uppercase tracking-wide">Visit Details</h3>
                                <div className="h-1 w-12 bg-[#78d64b] rounded-full mt-2" />
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-hide">
                                {/* QUICK DATE SELECTION */}
                                <div className="space-y-4">
                                    <label className="block text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] italic ml-2">Select Date</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {availableDates.map((d) => {
                                            const formattedDate = d.toISOString().split('T')[0];
                                            const isSelected = date === formattedDate;
                                            return (
                                                <button
                                                    key={d.toISOString()}
                                                    onClick={() => setDate(formattedDate)}
                                                    className={`relative flex flex-col items-center justify-center min-w-[70px] h-20 rounded-2xl transition-all duration-300 shrink-0 border border-gray-100 ${isSelected ? 'text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                                >
                                                    {isSelected && (
                                                        <motion.div layoutId="dateSelection" className="absolute inset-0 bg-gray-900 rounded-2xl -z-0" />
                                                    )}
                                                    <span className="relative z-10 text-[9px] font-black uppercase tracking-widest">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                                    <span className="relative z-10 text-xl font-black">{d.getDate()}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* QUICK TIME SLOTS */}
                                <div className="space-y-4">
                                    <label className="block text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] italic ml-2">Select Arrival Time</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {timeSlots.map((t) => {
                                            const isSelected = time === t;
                                            return (
                                                <button
                                                    key={t}
                                                    onClick={() => setTime(t)}
                                                    className={`relative h-10 rounded-xl transition-all duration-300 border border-gray-100 ${isSelected ? 'text-[#78d64b]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    {isSelected && (
                                                        <motion.div layoutId="timeSelection" className="absolute inset-0 bg-gray-900 rounded-xl -z-0" />
                                                    )}
                                                    <span className="relative z-10 text-[10px] font-black">{t}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* SCRUM-70: Error Feedback */}
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-widest shadow-sm"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                                    {error}
                                </motion.div>
                            )}

                            <button
                                onClick={() => handleSubmit()}
                                disabled={isSubmitting || !date || !time}
                                className="w-full py-5 px-8 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] text-white bg-gray-900 hover:bg-black transition-all shadow-2xl active:scale-95 disabled:opacity-30 flex items-center justify-center gap-4 group shrink-0"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-[#78d64b] rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Confirm Booking
                                        <svg className="w-4 h-4 text-[#78d64b] transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
