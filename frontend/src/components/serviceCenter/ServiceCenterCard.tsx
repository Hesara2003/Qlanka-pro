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

  const handleExport = async (e: React.MouseEvent) => {
      e.stopPropagation();
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

  const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/admin/service-centers/${center.centerId}/edit`);
  };

  const handleCardClick = () => {
      if (!isAdmin && isAvailable) {
          navigate(`/book/${center.centerId}`);
      }
  };

  return (
    <div 
        onClick={handleCardClick}
        className={`group bg-white rounded-[2.5rem] p-6 shadow-sm hover:shadow-premium hover:border-gray-200 border border-gray-100 transition-all duration-500 flex flex-col gap-6 relative overflow-hidden ${!isAdmin && isAvailable ? 'cursor-pointer' : ''}`}
    >
      {/* 1. Visual Status Strip (Left Edge) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-500 ${isAvailable ? "bg-[#78d64b]" : "bg-red-400"}`} />

      {/* 2. Top Identity Row */}
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-gray-900 font-semibold text-xl shadow-inner shrink-0 ${isAvailable ? "bg-[#78d64b]" : "bg-gray-100 text-gray-400"}`}>
          {initial}
        </div>
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight leading-tight mb-2 truncate">
            {center.name}
          </h3>
          <p className="text-[11px] font-normal text-gray-400 flex items-center gap-1.5 truncate">
            <svg className="w-3.5 h-3.5 text-[#78d64b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{center.address}</span>
          </p>
        </div>
      </div>

      {/* 3. Detailed Metrics Bar */}
      <div className="grid grid-cols-3 gap-2 px-2 py-4 bg-gray-50/50 rounded-2xl border border-gray-50/50">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-normal text-gray-400">Schedule</span>
          <p className="text-[10px] font-semibold text-gray-900 truncate">{center.openingTime} - {center.closingTime}</p>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-normal text-gray-400">Daily load</span>
          <p className="text-[10px] font-semibold text-gray-900 truncate">{center.capacity} hubs</p>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-normal text-[#78d64b]">Avg. Latency</span>
          <p className="text-[10px] font-semibold text-gray-900 truncate">~{center.averageServiceTimeMinutes} min</p>
        </div>
      </div>

      {/* 4. Action Row (Stays Visible for Admins) */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {/* Status indicator on bottom left */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold border ${isAvailable ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {isAvailable ? 'Operational' : 'Offline'}
        </div>

        {isAdmin ? (
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[11px] font-semibold text-gray-500 hover:text-[#78d64b] hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isExporting ? <div className="w-3 h-3 border-2 border-gray-200 border-t-[#78d64b] rounded-full animate-spin" /> : <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
              Export
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[11px] font-semibold hover:bg-black transition-all flex items-center gap-2 shadow-sm"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
          </div>
        ) : (
            <button
                disabled={!isAvailable}
                className={`text-[11px] font-semibold transition-all ${isAvailable ? 'text-gray-900 group-hover:translate-x-1' : 'text-gray-300'}`}
            >
                {isAvailable ? 'Initialize Booking →' : 'Hub Unavailable'}
            </button>
        )}
      </div>

      {exportError && (
        <div className="absolute top-4 right-4">
          <span className="text-[10px] font-normal text-red-500 bg-white px-2 py-0.5 rounded shadow-sm border border-red-50">
            {exportError}
          </span>
        </div>
      )}
    </div>
  );
}
