import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useServiceCenters } from "../hooks/useServiceCenters";
import ServiceCenterCard from "../components/serviceCenter/ServiceCenterCard";

export default function AdminServiceCentersPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<"all" | "available" | "unavailable">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const { centers, loading, error, refresh, lastUpdated } = useServiceCenters({
        autoRefresh: true,
        refreshInterval: 60_000,
    });

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredCenters = centers.filter((center) => {
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

    return (
        <div className="px-10 py-8">
            {/* Page Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-gray-900 tracking-tight mb-2">{t('serviceCenters.title')}</h1>
                    <p className="text-gray-400 text-[13px] font-bold mt-1 uppercase tracking-widest">
                        {t('serviceCenters.subtitle')}
                    </p>
                </div>
                {/* Admin-only: Create New Service Center button */}
                {user?.role === "admin" && (
                    <button
                        onClick={() => navigate("/admin/service-centers/create")}
                        className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {t('serviceCenters.createNew')}
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('serviceCenters.searchPlaceholder')}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 rounded-full font-bold text-[13px] transition-colors shadow-sm ${filter === "all"
                        ? "bg-black text-white"
                        : "bg-white text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50"
                        }`}
                >
                    {t('serviceCenters.filters.allCenters')}
                    <span className="ml-2 text-[11px] opacity-75">({centers.length})</span>
                </button>
                <button
                    onClick={() => setFilter("available")}
                    className={`px-4 py-2 rounded-full font-bold text-[13px] transition-colors shadow-sm ${filter === "available"
                        ? "bg-emerald-100 text-emerald-700 pointer-events-none border border-emerald-200"
                        : "bg-white text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50"
                        }`}
                >
                    {t('serviceCenters.filters.available')}
                    <span className="ml-2 text-[11px] opacity-75">
                        ({centers.filter((c) => c.isAvailable && c.isActive).length})
                    </span>
                </button>
                <button
                    onClick={() => setFilter("unavailable")}
                    className={`px-4 py-2 rounded-full font-bold text-[13px] transition-colors shadow-sm ${filter === "unavailable"
                        ? "bg-red-100 text-red-700 pointer-events-none border border-red-200"
                        : "bg-white text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50"
                        }`}
                >
                    {t('serviceCenters.filters.unavailable')}
                    <span className="ml-2 text-[11px] opacity-75">
                        ({centers.filter((c) => !c.isAvailable || !c.isActive).length})
                    </span>
                </button>
            </div>

            {/* Refresh controls — SCRUM-68 */}
            <div className="flex items-center justify-end gap-3 mb-4 min-h-[28px]">
                {lastUpdated && (
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {t('serviceCenters.lastUpdated', { time: lastUpdated.toLocaleTimeString() })}
                    </span>
                )}
                <button
                    onClick={refresh}
                    disabled={loading}
                    aria-label="Refresh service centers"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-full transition-colors shadow-sm disabled:opacity-40"
                >
                    <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('common.refresh')}
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">{t('serviceCenters.loading')}</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 font-semibold mb-2">{t('serviceCenters.errorLoading')}</p>
                    <p className="text-red-600 text-sm">{error}</p>
                    <button
                        onClick={refresh}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredCenters.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-600 font-semibold mb-2">{t('serviceCenters.noResults')}</p>
                    <p className="text-gray-500 text-sm">
                        {normalizedQuery !== ""
                            ? t('serviceCenters.noSearchResults', { query: searchQuery.trim() })
                            : filter !== "all"
                                ? t('serviceCenters.noResultsFilter', { filter })
                                : t('serviceCenters.noResultsGeneric')}
                    </p>
                </div>
            )}

            {/* Service Centers Grid */}
            {!loading && !error && filteredCenters.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCenters.map((center) => (
                        <ServiceCenterCard key={center.centerId} center={center} />
                    ))}
                </div>
            )}
        </div>
    );
}
