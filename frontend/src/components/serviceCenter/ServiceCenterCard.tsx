import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ServiceCenter } from "../../types/serviceCenter";
import { useAuth } from "../../context/AuthContext";
import { downloadDailyCenterSummaryCsv } from "../../api/reportsApi";

interface ServiceCenterCardProps {
  center: ServiceCenter;
}

export default function ServiceCenterCard({ center }: ServiceCenterCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const isAvailable = center.isAvailable && center.isActive;
  const initial = center.name.charAt(0).toUpperCase();

  const [dateRange] = useState({
      from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // 30 days ago
      to: new Date().toISOString().split('T')[0] // today
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const handleExport = async () => {
      try {
          setExportError("");
          setIsExporting(true);
          await downloadDailyCenterSummaryCsv(center.centerId, dateRange.from, dateRange.to);
      } catch (err: any) {
          setExportError(err.message || "Failed to download report");
      } finally {
          setIsExporting(false);
      }
  };

  return (
    <div className="group bg-white rounded-[2.5rem] p-4 lg:p-5 shadow-sm hover:shadow-premium border border-gray-100 transition-all duration-500 flex flex-col lg:flex-row items-center gap-6 lg:gap-10 relative overflow-hidden">
      
      {/* Visual Indicator - Vertical Stripe on Left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-500 ${isAvailable ? "bg-[#78d64b]" : "bg-red-400"}`} />

      {/* 1. Hub Identity Section */}
      <div className="flex items-center gap-6 shrink-0 w-full lg:w-auto">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-inner transition-transform duration-500 group-hover:scale-105 shrink-0 ${isAvailable ? "bg-[#78d64b]" : "bg-gray-100 text-gray-400"}`}>
          {initial}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-[20px] font-black text-gray-900 tracking-tighter leading-none mb-2 truncate">
            {center.name}
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 truncate">
            <svg className="w-3 h-3 text-[#78d64b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {center.address}
          </p>
        </div>
      </div>

      {/* 2. Metrics Strip - Middle Aligned */}
      <div className="flex flex-1 items-center justify-between lg:justify-start gap-8 lg:gap-16 w-full lg:w-auto px-2 lg:px-0">
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Schedule</span>
          <p className="text-[11px] font-black text-gray-900">{center.openingTime} - {center.closingTime}</p>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Daily Load</span>
          <p className="text-[11px] font-black text-gray-900">{center.capacity} Hubs</p>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-black text-[#78d64b] uppercase tracking-widest leading-none">Latency (Avg)</span>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-black text-gray-900">~{center.averageServiceTimeMinutes} Min</p>
            <div className="flex gap-0.5">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-1 h-3 rounded-full ${i <= (center.averageServiceTimeMinutes < 15 ? 1 : center.averageServiceTimeMinutes < 30 ? 2 : 3) ? 'bg-[#78d64b]' : 'bg-gray-100'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Status & Action Section */}
      <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto shrink-0 pr-2">
        {/* Status Badge */}
        <div className={`px-4 py-2 rounded-full text-[9px] uppercase tracking-[0.2em] font-black flex items-center gap-2 border shadow-sm transition-all ${isAvailable ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          {isAvailable ? "Operational" : "Offline"}
        </div>

        {!isAdmin ? (
          <button
            onClick={() => navigate(`/book/${center.centerId}`)}
            disabled={!isAvailable}
            className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-full font-black text-[11px] uppercase tracking-[0.15em] transition-all duration-300 active:scale-95 whitespace-nowrap ${isAvailable
              ? "bg-gray-900 text-white hover:bg-black hover:px-10 shadow-lg"
              : "bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-50"
              }`}
          >
            {isAvailable ? "Initialize" : "Disabled"}
            {isAvailable && (
              <svg className="w-4 h-4 text-[#78d64b] transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            )}
          </button>
        ) : (
          <div className="flex gap-2">
             <button
              onClick={handleExport}
              disabled={isExporting}
              title="Export Report"
              className="w-11 h-11 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[#78d64b] flex items-center justify-center transition-all shadow-inner border border-gray-100 disabled:opacity-50"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-gray-200 border-t-[#78d64b] rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              )}
            </button>
            <button
               onClick={() => navigate(`/admin/service-centers/${center.centerId}/edit`)}
               title="Edit Hub"
               className="w-11 h-11 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all shadow-inner border border-gray-100"
            >
               <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          </div>
        )}
      </div>

      {exportError && (
        <div className="absolute bottom-2 right-6">
          <span className="text-[9px] font-black text-red-500 uppercase italic bg-white px-2 py-0.5 rounded shadow-sm border border-red-50">
            {exportError}
          </span>
        </div>
      )}
    </div>
  );
}
