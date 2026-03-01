import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getAdminUsers, deleteAdminUser } from "../api/userApi";
import LanguageSelector from "../components/common/LanguageSelector";
import type { AdminUser, UserRole } from "../types/user";

// ──────────────────────────────────────────────────────────────
//  Role badge
// ──────────────────────────────────────────────────────────────
const ROLE_STYLES: Record<UserRole, string> = {
  admin:   "bg-purple-100 text-purple-700 border border-purple-200",
  officer: "bg-blue-100   text-blue-700   border border-blue-200",
  citizen: "bg-green-100  text-green-700  border border-green-200",
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_STYLES[role]}`}>
      {role}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
//  Status badge
// ──────────────────────────────────────────────────────────────
function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Inactive
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
//  Confirmation dialog
// ──────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  user: AdminUser;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteDialog({ user, deleting, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation();

  // Trap focus inside modal
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !deleting) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleting, onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => { if (!deleting) onCancel(); }}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Icon */}
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <h2 id="confirm-dialog-title" className="text-xl font-bold text-gray-900 text-center mb-1">
          {t("adminUsers.deleteDialog.title")}
        </h2>
        <p id="confirm-dialog-desc" className="text-sm text-gray-500 text-center mb-4">
          {t("adminUsers.deleteDialog.message", { username: user.username })}
        </p>

        {/* User card */}
        <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-gray-600">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <RoleBadge role={user.role} />
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          {t("adminUsers.deleteDialog.warning")}
        </p>

        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t("adminUsers.deleteDialog.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t("adminUsers.deleteDialog.deleting")}
              </>
            ) : (
              t("adminUsers.deleteDialog.confirm")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
//  Empty state
// ──────────────────────────────────────────────────────────────
function EmptyState({ filtered }: { filtered: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16 text-gray-400">
      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <p className="font-medium text-gray-500">
        {filtered ? t("adminUsers.noFilterResults") : t("adminUsers.noUsers")}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
//  Main page
// ──────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ── auth guard ────────────────────────────────────────────
  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "admin") navigate("/dashboard");
  }, [user, navigate]);

  // ── state ─────────────────────────────────────────────────
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [roleFilter, setRoleFilter]     = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [toastMsg, setToastMsg]         = useState<{ text: string; type: "success" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── load users ────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t("adminUsers.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── toast helpers ─────────────────────────────────────────
  function showToast(text: string, type: "success" | "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg({ text, type });
    toastTimer.current = setTimeout(() => setToastMsg(null), 4000);
  }

  // ── delete flow ───────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdminUser(pendingDelete.userId);
      setUsers((prev) => prev.filter((u) => u.userId !== pendingDelete.userId));
      showToast(t("adminUsers.deleteSuccess", { username: pendingDelete.username }), "success");
      setPendingDelete(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("adminUsers.deleteError"), "error");
    } finally {
      setDeleting(false);
    }
  }

  // ── filtering ─────────────────────────────────────────────
  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter === "active"   && !u.isActive) return false;
    if (statusFilter === "inactive" &&  u.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !u.username.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const isFiltered = roleFilter !== "all" || statusFilter !== "all" || searchQuery.trim().length > 0;

  // ── helpers ───────────────────────────────────────────────
  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  }

  // ── render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* ── Nav ── */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">{t("common.appName")}</span>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <LanguageSelector />
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {t("common.signOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
            {t("adminUsers.breadcrumbHome")}
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">{t("adminUsers.title")}</span>
        </nav>

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("adminUsers.title")}</h1>
            <p className="text-gray-500 text-sm mt-1">{t("adminUsers.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold rounded-lg">
                {t("adminUsers.totalLabel", { count: users.length })}
              </span>
            )}
            <button
              onClick={loadUsers}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t("common.refresh")}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("adminUsers.searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="all">{t("adminUsers.filters.allRoles")}</option>
            <option value="admin">{t("adminUsers.filters.admin")}</option>
            <option value="officer">{t("adminUsers.filters.officer")}</option>
            <option value="citizen">{t("adminUsers.filters.citizen")}</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="all">{t("adminUsers.filters.allStatus")}</option>
            <option value="active">{t("adminUsers.filters.active")}</option>
            <option value="inactive">{t("adminUsers.filters.inactive")}</option>
          </select>

          {/* Clear filters */}
          {isFiltered && (
            <button
              onClick={() => { setSearchQuery(""); setRoleFilter("all"); setStatusFilter("all"); }}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
            >
              {t("adminUsers.clearFilters")}
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">{t("adminUsers.loading")}</span>
          </div>
        ) : loadError ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <svg className="w-10 h-10 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-700 font-medium mb-4">{loadError}</p>
            <button
              onClick={loadUsers}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {t("common.retry")}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <EmptyState filtered={isFiltered} />
          </div>
        ) : (
          <>
            {/* Results count */}
            {isFiltered && (
              <p className="text-sm text-gray-500 mb-3">
                {t("adminUsers.showingResults", { shown: filtered.length, total: users.length })}
              </p>
            )}

            {/* Table — desktop */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hidden sm:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                      {t("adminUsers.table.user")}
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                      {t("adminUsers.table.role")}
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                      {t("adminUsers.table.status")}
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                      {t("adminUsers.table.lastLogin")}
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                      {t("adminUsers.table.joined")}
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((u) => (
                    <tr key={u.userId} className="hover:bg-gray-50 transition-colors group">
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0 text-white text-sm font-bold shadow-sm">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{u.username}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                          {!u.isEmailVerified && (
                            <span className="hidden lg:inline-block text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              {t("adminUsers.unverified")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-4">
                        <RoleBadge role={u.role} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge isActive={u.isActive} />
                      </td>

                      {/* Last login */}
                      <td className="px-4 py-4 text-gray-500 text-xs">
                        {formatDate(u.lastLoginAt)}
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-4 text-gray-500 text-xs">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setPendingDelete(u)}
                          disabled={u.role === "admin"}
                          title={u.role === "admin" ? t("adminUsers.cannotDeleteAdmin") : t("adminUsers.deleteUser")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {t("adminUsers.deleteUser")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card list — mobile */}
            <div className="sm:hidden space-y-3">
              {filtered.map((u) => (
                <div key={u.userId} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0 text-white font-bold">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{u.username}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPendingDelete(u)}
                      disabled={u.role === "admin"}
                      className="shrink-0 p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label={t("adminUsers.deleteUser")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <RoleBadge role={u.role} />
                    <StatusBadge isActive={u.isActive} />
                    {!u.isEmailVerified && (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {t("adminUsers.unverified")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {t("adminUsers.table.joined")}: {formatDate(u.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Confirmation dialog */}
      {pendingDelete && (
        <ConfirmDeleteDialog
          user={pendingDelete}
          deleting={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { if (!deleting) setPendingDelete(null); }}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all
            ${toastMsg.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
        >
          {toastMsg.type === "success" ? (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toastMsg.text}
        </div>
      )}
    </div>
  );
}
