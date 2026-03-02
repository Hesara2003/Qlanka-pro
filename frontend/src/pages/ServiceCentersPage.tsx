import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useServiceCenters } from "../hooks/useServiceCenters";
import ServiceCenterCard from "../components/serviceCenter/ServiceCenterCard";
import LanguageSelector from "../components/common/LanguageSelector";

type SortOption = "nameAsc" | "nameDesc" | "capacityDesc" | "serviceTimeAsc";

export default function ServiceCentersPage() {
  const { t } = useTranslation();
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
    <main className="w-full max-w-7xl mx-auto py-8">
      {/* Page Header Area */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Service Centers</h1>
          <p className="text-sm font-medium text-gray-500 max-w-xl leading-relaxed">
            Find the nearest QueueLanka service center. Book your virtual ticket in advance to save time and reduce your waiting period.
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10 shrink-0">
          <LanguageSelector />
          {/* Admin-only: Create New Service Center button */}
          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/admin/service-centers/create")}
              className="shrink-0 flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-900 border border-transparent hover:border-gray-800 text-white text-sm font-bold rounded-full shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              {t('serviceCenters.createNew')}
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filtering & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-gray-100 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-20 z-30">

        {/* Search */}
        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // reset to page 1 on search
            }}
            placeholder="Search by name or address..."
            className="block w-full pl-11 pr-10 py-3 border-none bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-xl text-gray-900 text-sm font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button
              onClick={() => { setFilter("all"); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              All
            </button>
            <button
              onClick={() => { setFilter("available"); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === "available" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Available
            </button>
            <button
              onClick={() => { setFilter("unavailable"); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === "unavailable" ? "bg-white text-red-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Closed
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl px-1">
            <span className="pl-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setCurrentPage(1);
              }}
              className="appearance-none bg-transparent border-none text-sm font-bold text-gray-900 py-2.5 pl-2 pr-8 focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="nameAsc">Name (A-Z)</option>
              <option value="nameDesc">Name (Z-A)</option>
              <option value="capacityDesc">Highest Capacity</option>
              <option value="serviceTimeAsc">Fastest Service Time</option>
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>

          {/* Refresh controls */}
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2.5 text-gray-500 bg-gray-50 border border-gray-100 hover:bg-gray-100 hover:text-blue-600 rounded-xl transition-colors disabled:opacity-50"
            title={`Last updated: ${lastUpdated?.toLocaleTimeString()}`}
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && filteredAndSortedCenters.length === 0 && (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-gray-100 border-dashed">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">Loading Service Centers...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center shadow-sm">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800 font-bold text-lg mb-2">Failed to Load Centers</p>
          <p className="text-red-600 text-sm font-medium mb-6">{error}</p>
          <button
            onClick={refresh}
            className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-full hover:bg-red-700 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAndSortedCenters.length === 0 && (
        <div className="bg-white p-16 rounded-3xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border-dashed text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-lg font-bold text-gray-900 mb-2">No Service Centers Found</p>
          <p className="text-sm font-medium text-gray-500">
            {searchQuery
              ? `We couldn't find any centers matching "${searchQuery}".`
              : "There are currently no service centers matching your criteria."}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="mt-6 px-6 py-2.5 bg-gray-100 text-gray-900 text-sm font-bold rounded-full hover:bg-gray-200 transition-colors">
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Service Centers Grid */}
      {!loading && !error && currentCenters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentCenters.map((center) => (
            <ServiceCenterCard key={center.centerId} center={center} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && totalPages > 1 && (
        <div className="mt-12 flex items-center justify-between border-t border-gray-200/60 pt-6 px-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Previous
          </button>

          <div className="flex items-center gap-1.5 hidden sm:flex">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${currentPage === page
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          <div className="sm:hidden text-sm font-bold text-gray-500">
            Page {currentPage} of {totalPages}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-gray-600 transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </main>
  );
}
