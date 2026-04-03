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

  const [dateRange, setDateRange] = useState({
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
    <div className="group bg-white rounded-[2.5rem] p-8 shadow-premium hover:shadow-2xl border border-gray-100 transition-all duration-500 flex flex-col relative overflow-hidden h-full">

      {/* Status indicator ribbon */}
      <div className={`absolute top-0 inset-x-0 h-1.5 transition-colors duration-500 ${isAvailable ? "bg-[#78d64b]" : "bg-red-400"}`} />

      {/* Header section with icon and title */}
      <div className="flex gap-6 mb-8">
        {/* Abstract Icon/Initial */}
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-black text-2xl font-black shadow-inner shrink-0 transition-transform duration-500 group-hover:scale-110 ${isAvailable ? "bg-[#78d64b]" : "bg-gray-100 text-gray-400"}`}>
          {initial}
        </div>

        <div className="flex-1 min-w-0 pt-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none truncate mb-2">
              {center.name}
            </h3>
            {/* Status Badge */}
            <div className={`shrink-0 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-[0.2em] font-black flex items-center gap-2 border ${isAvailable ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              {isAvailable ? "Online" : "Offline"}
            </div>
          </div>

          <p className="text-xs font-bold text-gray-400 flex items-center gap-2 mt-1 uppercase tracking-widest">
            <svg className="w-4 h-4 text-[#78d64b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="truncate">{center.address}</span>
          </p>
        </div>
      </div>

      {center.description && (
        <p className="text-sm leading-relaxed text-gray-500 mb-8 line-clamp-2 min-h-[40px] font-medium italic">
          "{center.description}"
        </p>
      )}

      {/* Metrics Row - High Density */}
      <div className="grid grid-cols-2 gap-3 mb-10 mt-auto">
        <div className="flex flex-col gap-1 bg-gray-50/50 border border-gray-100 px-5 py-4 rounded-[1.5rem] shadow-inner">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Operating Hours</span>
          <p className="text-xs font-black text-gray-900 mt-1">{center.openingTime} - {center.closingTime}</p>
        </div>
        <div className="flex flex-col gap-1 bg-gray-50/50 border border-gray-100 px-5 py-4 rounded-[1.5rem] shadow-inner">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Daily Capacity</span>
          <p className="text-xs font-black text-gray-900 mt-1">{center.capacity} Tickets</p>
        </div>
        <div className="col-span-2 flex items-center justify-between bg-[#78d64b]/5 border border-[#78d64b]/10 px-6 py-4 rounded-[1.5rem]">
           <div className="flex flex-col gap-1">
             <span className="text-[9px] font-black text-[#78d64b] uppercase tracking-widest leading-none">Avg Latency</span>
             <p className="text-sm font-black text-gray-900 mt-1">~{center.averageServiceTimeMinutes} Minutes</p>
           </div>
           <svg className="w-6 h-6 text-[#78d64b] opacity-40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
      </div>

      {/* Action Area */}
      {!isAdmin ? (
        <button
          onClick={() => navigate(`/book/${center.centerId}`)}
          disabled={!isAvailable}
          className={`w-full py-5 px-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 group-hover:shadow-2xl active:scale-95 ${isAvailable
            ? "bg-gray-900 text-white hover:bg-black"
            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-50"
            }`}
        >
          {isAvailable ? "Initialize Connection" : "Sector Offline"}
          {isAvailable && (
            <svg className="w-4 h-4 text-[#78d64b] transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          )}
        </button>
      ) : (
        <div className="flex flex-col gap-4 w-full bg-gray-50/50 p-6 border border-gray-100 rounded-[2rem] shadow-inner">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Data Export</span>
                {exportError && <span className="text-[9px] font-black text-red-500 uppercase">{exportError}</span>}
            </div>
            
            <div className="flex items-center gap-3">
                <input 
                    type="date" 
                    value={dateRange.from}
                    max={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="flex-1 min-w-0 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#78d64b]/20 transition-all"
                />
                <span className="text-gray-300 text-[10px] font-black uppercase">to</span>
                <input 
                    type="date"
                    value={dateRange.to}
                    min={dateRange.from}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="flex-1 min-w-0 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#78d64b]/20 transition-all"
                />
            </div>
            
            <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white text-gray-900 hover:bg-gray-50 border border-gray-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm"
            >
                {isExporting ? (
                    <>
                        <div className="w-3 h-3 border-2 border-gray-200 border-t-[#78d64b] rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4 text-[#78d64b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export Summary
                    </>
                )}
            </button>
        </div>
      )}
    </div>
  );
}
