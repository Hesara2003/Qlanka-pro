import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useServiceCenters } from "../hooks/useServiceCenters";
import ServiceCenterCard from "../components/serviceCenter/ServiceCenterCard";

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
  const itemsPerPage = 12; // Increased for grid density

  // use shared hook — auto-refreshes every 60 s
  const { centers, loading, error, refresh, lastUpdated } = useServiceCenters({
    autoRefresh: true,
    refreshInterval: 60_000,
  });

  // Calculate sorted and filtered centers
  const filteredAndSortedCenters = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

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

  const totalItems = filteredAndSortedCenters.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

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
    <main className="w-full max-w-[1400px] mx-auto py-8 text-gray-900 selection:bg-[#78d64b]/30 min-h-screen">
      
      {/* 1. Sync & Control Bar - Top Right Alignment */}
      <div className="flex justify-end items-center gap-4 mb-10 px-4">
        {lastUpdated && (
            <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest">
                Updated {lastUpdated.toLocaleTimeString()}
            </span>
        )}
        <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-all text-[11px] font-semibold text-gray-900"
        >
            <svg className={`w-4 h-4 ${loading ? "animate-spin text-[#78d64b]" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
        </button>
      </div>

      {/* 2. Page Identity */}
      <div className="mb-14 px-4">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6">
              <div className="max-w-2xl">
                  <h1 className="text-5xl lg:text-6xl font-semibold tracking-tight text-gray-900 leading-none mb-4">
                      Service Centers
                  </h1>
                  <p className="text-base text-gray-400 font-normal">
                      Manage and monitor the real-time status of service network hubs.
                  </p>
              </div>
              {user?.role === "admin" && (
                <button
                    onClick={() => navigate("/admin/service-centers/create")}
                    className="flex items-center gap-3 px-8 py-3.5 bg-gray-900 text-white text-xs font-semibold rounded-full shadow-lg hover:bg-black transition-all active:scale-95"
                >
                    <svg className="w-4 h-4 text-[#78d64b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Hub
                </button>
              )}
          </div>
      </div>

      {/* 3. Filtering Toolset (Subtle) */}
      <div className="bg-white rounded-[2rem] p-3 shadow-sm border border-gray-100 mb-10 flex flex-col lg:flex-row gap-4 items-center mx-4">
        <div className="relative flex-1 w-full">
            <svg className="h-5 w-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search segment..."
                className="block w-full pl-14 pr-8 py-3.5 border-none bg-gray-50/50 rounded-2xl text-gray-900 text-sm font-normal focus:bg-white focus:ring-2 focus:ring-gray-900/5 transition-all"
            />
        </div>
        <div className="flex bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
            {["all", "available", "unavailable"].map((f) => (
                <button
                    key={f}
                    onClick={() => { setFilter(f as any); setCurrentPage(1); }}
                    className={`px-6 py-2 text-xs font-semibold rounded-xl transition-all ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
            ))}
        </div>
        <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortOption); setCurrentPage(1); }}
            className="px-6 py-3.5 text-xs font-semibold text-gray-600 border-none bg-gray-50/50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-900/5 cursor-pointer shadow-sm"
        >
            <option value="nameAsc">Alphabetical</option>
            <option value="nameDesc">Name desc</option>
            <option value="capacityDesc">Density (max)</option>
            <option value="serviceTimeAsc">Latency (min)</option>
        </select>
      </div>

      {/* 4. The Hub Grid (3-Columns) */}
      <div className="px-4">
        {loading && filteredAndSortedCenters.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-32 bg-white rounded-[4rem] border border-gray-100 italic">
                <div className="w-12 h-12 border-4 border-gray-50 border-t-[#78d64b] rounded-full animate-spin mb-6" />
                <p className="text-xs font-semibold text-gray-400">Syncing database...</p>
            </div>
        ) : error && !loading ? (
            <div className="bg-red-50/50 border border-red-100 p-16 rounded-[4rem] text-center max-w-2xl mx-auto shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sync Error</h2>
                <p className="text-sm font-normal text-red-600 mb-8">{error}</p>
                <button onClick={refresh} className="px-10 py-3.5 bg-red-500 text-white text-xs font-semibold rounded-full hover:bg-red-600 transition-all">Retry Sync</button>
            </div>
        ) : filteredAndSortedCenters.length === 0 ? (
            <div className="bg-white p-32 rounded-[4rem] border border-gray-100 text-center shadow-sm">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Hubs not detected</h3>
                <p className="text-sm font-normal text-gray-400 mb-8">No results matches for sector segment.</p>
                <button onClick={() => setSearchQuery("")} className="px-8 py-3 bg-gray-900 text-white text-xs font-semibold rounded-full">Reset search</button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentCenters.map((center) => (
                    <ServiceCenterCard key={center.centerId} center={center} />
                ))}
            </div>
        )}
      </div>

      {/* 5. Pagination (Subtle Floating) */}
      {!loading && !error && totalPages > 1 && (
        <div className="mt-16 flex items-center justify-between bg-white px-10 py-6 rounded-[2.5rem] border border-gray-100 shadow-sm mx-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-3 text-xs font-semibold text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-all group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15 19l-7-7 7-7" /></svg>
            Backward
          </button>

          <div className="hidden sm:flex items-center gap-3">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-semibold transition-all ${currentPage === page ? "bg-gray-900 text-[#78d64b] shadow-lg scale-110" : "text-gray-400 hover:bg-gray-50"}`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-3 text-xs font-semibold text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-all group"
          >
            Forward
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </main>
  );
}
