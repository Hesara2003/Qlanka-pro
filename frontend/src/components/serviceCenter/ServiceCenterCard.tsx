import { useNavigate } from "react-router-dom";
import type { ServiceCenter } from "../../types/serviceCenter";
import { useAuth } from "../../context/AuthContext";

interface ServiceCenterCardProps {
  center: ServiceCenter;
}

export default function ServiceCenterCard({ center }: ServiceCenterCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const isAvailable = center.isAvailable && center.isActive;
  const initial = center.name.charAt(0).toUpperCase();

  return (
    <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] border border-gray-100 transition-all duration-300 flex flex-col relative overflow-hidden">

      {/* Status indicator ribbon */}
      <div className={`absolute top-0 inset-x-0 h-1.5 ${isAvailable ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-red-400 to-red-500"}`} />

      {/* Header section with icon and title */}
      <div className="flex gap-5 mb-6">
        {/* Abstract Icon/Initial */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-sm shrink-0 ${isAvailable ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-gray-400 to-gray-500"}`}>
          {initial}
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[19px] font-extrabold text-gray-900 tracking-tight leading-tight truncate">
              {center.name}
            </h3>
            {/* Status Badge */}
            <div className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 ${isAvailable ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              {isAvailable ? "Open" : "Closed"}
            </div>
          </div>

          <p className="text-[13px] font-medium text-gray-500 flex items-center gap-1.5 mt-1.5 truncate">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="truncate">{center.address}</span>
          </p>
        </div>
      </div>

      {center.description && (
        <p className="text-[14px] leading-relaxed text-gray-600 mb-6 line-clamp-2 min-h-[42px]">
          {center.description}
        </p>
      )}

      {/* Metrics Row */}
      <div className="flex flex-wrap gap-2 mb-8 mt-auto">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-[12px] font-semibold text-gray-700">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {center.openingTime} - {center.closingTime}
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-[12px] font-semibold text-gray-700 hover:border-gray-200 transition-colors">
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Up to {center.capacity} / day
        </div>
        <div className="flex items-center gap-2 bg-amber-50/50 border border-amber-100/50 px-3 py-2 rounded-xl text-[12px] font-semibold text-amber-800">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          ~{center.averageServiceTimeMinutes} min service
        </div>
      </div>

      {/* Action Area */}
      {!isAdmin && (
        <button
          onClick={() => navigate(`/book/${center.centerId}`)}
          disabled={!isAvailable}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-200 group-hover:scale-[1.02] active:scale-[0.98] ${isAvailable
            ? "bg-black text-white hover:bg-gray-900 shadow-md hover:shadow-xl"
            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            }`}
        >
          {isAvailable ? "Join Queue" : "Currently Unavailable"}
          {isAvailable && (
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          )}
        </button>
      )}
    </div>
  );
}
