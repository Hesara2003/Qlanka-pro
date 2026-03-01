import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getAllServiceCenters } from "../api/serviceCenterApi";
import type { ServiceCenter } from "../types/serviceCenter";
import ServiceCenterCard from "../components/serviceCenter/ServiceCenterCard";
import LanguageSelector from "../components/common/LanguageSelector";

export default function ServiceCentersPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "available" | "unavailable">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchCenters() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllServiceCenters();
        setCenters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load service centers");
      } finally {
        setLoading(false);
      }
    }

    fetchCenters();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header/Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">{t('common.appName')}</span>
            </div>

            {/* User Info & Logout */}
            {user && (
              <div className="flex items-center gap-4">
                <LanguageSelector />
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  {t('common.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('serviceCenters.title')}</h1>
          <p className="text-gray-600">
            {t('serviceCenters.subtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('serviceCenters.searchPlaceholder')}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {t('serviceCenters.filters.allCenters')}
            <span className="ml-2 text-xs opacity-75">({centers.length})</span>
          </button>
          <button
            onClick={() => setFilter("available")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              filter === "available"
                ? "bg-green-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {t('serviceCenters.filters.available')}
            <span className="ml-2 text-xs opacity-75">
              ({centers.filter((c) => c.isAvailable && c.isActive).length})
            </span>
          </button>
          <button
            onClick={() => setFilter("unavailable")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              filter === "unavailable"
                ? "bg-red-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {t('serviceCenters.filters.unavailable')}
            <span className="ml-2 text-xs opacity-75">
              ({centers.filter((c) => !c.isAvailable || !c.isActive).length})
            </span>
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
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-700 font-semibold mb-2">{t('serviceCenters.errorLoading')}</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCenters.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
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
      </main>
    </div>
  );
}
