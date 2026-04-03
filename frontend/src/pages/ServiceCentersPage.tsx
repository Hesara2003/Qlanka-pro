import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useServiceCenters } from "../hooks/useServiceCenters";
import ServiceCenterCard from "../components/serviceCenter/ServiceCenterCard";
import LanguageSelector from "../components/common/LanguageSelector";

type SortOption = "nameAsc" | "nameDesc" | "capacityDesc" | "serviceTimeAsc";

export default function ServiceCentersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filtering & Sorting State
  const [filter, setFilter] = useState<"all" | "available" | "unavailable">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("nameAsc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // SCRUM-68: use shared hook — auto-refreshes every 60 s
  const { centers, loading, error, refresh, lastUpdated } = useServiceCenters({
    autoRefresh: true,
    refreshInterval: 60_000,
  });

  // Calculate sorted and filtered centers
  const filteredAndSortedCenters = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    // 1. Filter
    let result = centers.filter((center) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "available" && center.isAvailable && center.isActive) ||
        (filter === "unavailable" && (!center.isAvailable || !center.isActive));

      const matchesSearch =
        normalizedQuery === "" ||
        center.name.toLowerCase().includes(normalizedQuery) ||
        center.address.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });

    // 2. Sort
    result = result.sort((a, b) => {
      switch (sortBy) {
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "capacityDesc":
          return (b.capacity || 0) - (a.capacity || 0);
        case "serviceTimeAsc":
          return (a.averageServiceTimeMinutes || 0) - (b.averageServiceTimeMinutes || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [centers, filter, searchQuery, sortBy]);

  // Handle Pagination variables
  const totalItems = filteredAndSortedCenters.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Ensure current page is valid after filtering
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCenters = filteredAndSortedCenters.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="w-full max-w-[1400px] mx-auto py-8 text-gray-900 selection:bg-[#78d64b]/30">
      
      {/* Page Header Area - Cinematic Editorial Style */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center text-[#78d64b]">
                 <svg className="w-5 h-5 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Network Directory</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-medium tracking-tight mb-6 leading-[0.9]">
              Service <span className="italic" style={{ fontFamily: "'Playfair Display', serif" }}>Centers</span>
            </h1>
            <p className="text-lg text-gray-500 font-medium tracking-tight leading-relaxed">
              Find the nearest QueueLanka service network. Book your ticket in advance to eliminate waiting and maximize productivity.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 pb-2">
            <LanguageSelector />
            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/admin/service-centers/create")}
                className="shrink-0 flex items-center gap-3 px-8 py-4 bg-gray-900 border border-transparent hover:bg-black text-white text-xs font-black rounded-3xl shadow-2xl transition-all active:scale-95 uppercase tracking-widest"
              >
                <svg className="w-4 h-4 text-[#78d64b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Create Hub
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filtering & Search Bar - Premium Floating Style */}
      <div className="bg-white rounded-[2.5rem] p-3 shadow-premium border border-gray-100 mb-12 flex flex-col lg:flex-row gap-3 items-center justify-between sticky top-8 z-30 mx-1">
        
        {/* Search Input */}
        <div className="relative w-full lg:flex-1">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search network address..."
            className="block w-full pl-14 pr-12 py-4 border-none bg-gray-50/50 hover:bg-gray-50 focus:bg-white rounded-3xl text-gray-900 text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#78d64b]/20 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
              className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-300 hover:text-red-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto pr-1">
          {/* Status Filter Toggle */}
          <div className="flex bg-gray-50/50 p-1.5 rounded-[2rem] border border-gray-100 shadow-inner">
            <button
              onClick={() => { setFilter("all"); setCurrentPage(1); }}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              All Hubs
            </button>
            <button
              onClick={() => { setFilter("available"); setCurrentPage(1); }}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${filter === "available" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              Available
            </button>
            <button
              onClick={() => { setFilter("unavailable"); setCurrentPage(1); }}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${filter === "unavailable" ? "bg-white text-red-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              Closed
            </button>
          </div>

          {/* Sort Menu */}
          <div className="relative flex items-center bg-gray-50/50 border border-gray-100 rounded-[2rem] px-2 shadow-inner group">
            <span className="pl-4 text-[10px] font-black text-gray-300 uppercase tracking-widest italic group-hover:text-gray-400 transition-colors">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setCurrentPage(1);
              }}
              className="appearance-none bg-transparent border-none text-[11px] font-black text-gray-900 py-3 pl-3 pr-10 focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-widest"
            >
              <option value="nameAsc">Alphabetical</option>
              <option value="nameDesc">Name Desc</option>
              <option value="capacityDesc">Density (Max)</option>
              <option value="serviceTimeAsc">Latency (Min)</option>
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
          </div>

          {/* Refresh Action */}
          <button
            onClick={refresh}
            disabled={loading}
            className="w-12 h-12 flex items-center justify-center text-gray-400 bg-gray-50/50 border border-gray-100 hover:bg-white hover:text-[#78d64b] rounded-full transition-all shadow-inner hover:shadow-premium disabled:opacity-50"
            title={`Last synced: ${lastUpdated?.toLocaleTimeString()}`}
          >
            <svg className={`w-5 h-5 ${loading ? "animate-spin text-[#78d64b]" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading & Empty States */}
      {loading && filteredAndSortedCenters.length === 0 && (
        <div className="flex flex-col items-center justify-center p-32 bg-white rounded-[3.5rem] border border-gray-100 shadow-sm">
          <div className="w-16 h-16 border-[6px] border-gray-50 border-t-[#78d64b] rounded-full animate-spin mb-8" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Syncing Network Database...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50/50 border border-red-100 p-16 rounded-[4rem] text-center shadow-sm max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-red-100 rounded-[2.5rem] flex items-center justify-center text-red-500 mx-auto mb-8 shadow-inner">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-4 italic">CRITICAL ERROR</h2>
          <p className="text-sm font-bold text-red-600 mb-10 max-w-sm mx-auto uppercase tracking-widest opacity-80">{error}</p>
          <button onClick={refresh} className="px-12 py-5 bg-red-500 text-white text-xs font-black rounded-3xl hover:bg-red-600 transition-all shadow-2xl uppercase tracking-widest active:scale-95">
            Retry Connection
          </button>
        </div>
      )}

      {!loading && !error && filteredAndSortedCenters.length === 0 && (
        <div className="bg-white p-32 rounded-[4rem] border border-gray-100 shadow-premium text-center max-w-4xl mx-auto">
          <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-200 mx-auto mb-8">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-3 italic">HUB NOT FOUND</h3>
          <p className="text-sm font-bold text-gray-400 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
            {searchQuery
              ? `Negative search results for segment "${searchQuery}".`
              : "No active service centers detected in current sector."}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="mt-10 px-10 py-4 bg-gray-900 text-white text-[10px] font-black rounded-3xl hover:bg-black transition-all shadow-xl uppercase tracking-widest">
              Reset Query
            </button>
          )}
        </div>
      )}

      {/* Hub Grid */}
      {!loading && !error && currentCenters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {currentCenters.map((center) => (
            <ServiceCenterCard key={center.centerId} center={center} />
          ))}
        </div>
      )}

      {/* Pagination Controls - Premium Floating Bar */}
      {!loading && !error && totalPages > 1 && (
        <div className="mt-20 flex items-center justify-between bg-white px-8 py-5 rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#78d64b]/20 to-transparent opacity-50" />
          
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-400 transition-all group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
            Backward
          </button>

          <div className="flex items-center gap-2 hidden sm:flex">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-11 h-11 flex items-center justify-center rounded-2xl text-[11px] font-black transition-all relative ${currentPage === page
                    ? "bg-gray-900 text-[#78d64b] shadow-2xl scale-110"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-900 hover:scale-105 shadow-inner border border-transparent hover:border-gray-100"
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          <div className="sm:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-none">
            Page {currentPage} <span className="text-gray-200 mx-1">/</span> {totalPages}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-400 transition-all group"
          >
            Forward
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </main>
  );
}
