import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getAdminUsers, deleteAdminUser } from "../api/userApi";
import type { AdminUser, UserRole } from "../types/user";
import { exportToCsv, exportToPdf } from "../utils/exportUtils";

// ──────────────────────────────────────────────────────────────
//  Role badge
// ──────────────────────────────────────────────────────────────
const ROLE_STYLES: Record<UserRole, string> = {
  admin: "bg-slate-800 text-white border-transparent",
  officer: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  citizen: "bg-slate-50 text-slate-500 border border-slate-100",
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_STYLES[role]}`}>
      {role}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
//  Status badge
// ──────────────────────────────────────────────────────────────
function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-400 border border-slate-100">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
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

  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);

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
      data-testid="confirm-delete-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => { if (!deleting) onCancel(); }}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150 border border-gray-100">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <h2 id="confirm-dialog-title" className="text-xl font-semibold text-gray-900 text-center mb-1">
          {t("adminUsers.deleteDialog.title")}
        </h2>
        <p id="confirm-dialog-desc" className="text-sm font-normal text-gray-500 text-center mb-4">
          {t("adminUsers.deleteDialog.message", { username: user.username })}
        </p>

        <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-gray-600">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
            <p className="text-xs font-normal text-gray-500 truncate">{user.email}</p>
          </div>
          <RoleBadge role={user.role} />
        </div>

        <p className="text-xs font-normal text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          {t("adminUsers.deleteDialog.warning")}
        </p>

        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t("adminUsers.deleteDialog.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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

function EmptyState({ filtered }: { filtered: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16 text-gray-400">
      <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <p className="font-normal text-gray-500">
        {filtered ? t("adminUsers.noFilterResults") : t("adminUsers.noUsers")}
      </p>
    </div>
  );
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "admin") navigate("/admin");
  }, [user, navigate]);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function showToast(text: string, type: "success" | "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg({ text, type });
    toastTimer.current = setTimeout(() => setToastMsg(null), 4000);
  }

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

  const handleExportCsv = () => {
    const columns = [
      { header: "Username", key: "username" },
      { header: "Email", key: "email" },
      { header: "Role", key: "role" },
      { header: "Status", key: (u: AdminUser) => u.isActive ? "Active" : "Inactive" },
      { header: "Joined", key: (u: AdminUser) => formatDate(u.createdAt) },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(filtered, columns, `QueueLanka_Users_Report_${date}`);
  };

  const handleExportPdf = () => {
    const columns = [
      { header: "Username", key: "username" },
      { header: "Email", key: "email" },
      { header: "Role", key: "role" },
      { header: "Status", key: (u: AdminUser) => u.isActive ? "Active" : "Inactive" },
      { header: "Joined", key: (u: AdminUser) => formatDate(u.createdAt) },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToPdf(filtered, columns, "Admin Users Report", `QueueLanka_Users_Report_${date}`);
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter === "active" && !u.isActive) return false;
    if (statusFilter === "inactive" && u.isActive) return false;
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

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  }

  return (
    <>
      <div className="px-10 py-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">{t("adminUsers.title")}</h1>
            <p className="text-gray-400 text-[13px] font-normal mt-1">{t("adminUsers.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              <span className="px-4 py-2 bg-slate-50 text-slate-500 text-xs font-semibold rounded-full border border-gray-100">
                {t("adminUsers.totalLabel", { count: users.length })} accounts
              </span>
            )}
            <button
              onClick={loadUsers}
              disabled={loading}
              className="bg-gray-900 text-white text-xs font-semibold px-6 py-2.5 rounded-full hover:bg-black transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <div className="flex items-center gap-2 border-l border-gray-100 pl-3">
              <button
                onClick={handleExportCsv}
                disabled={loading || filtered.length === 0}
                className="p-2.5 bg-white border border-gray-100 rounded-full hover:bg-gray-50 text-gray-400 hover:text-emerald-500 transition-all shadow-sm disabled:opacity-50"
                title="Export to CSV"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
              <button
                onClick={handleExportPdf}
                disabled={loading || filtered.length === 0}
                className="p-2.5 bg-white border border-gray-100 rounded-full hover:bg-gray-50 text-gray-400 hover:text-red-500 transition-all shadow-sm disabled:opacity-50"
                title="Export to PDF"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 p-6 mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <svg className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email"
              className="w-full pl-14 pr-8 py-4 text-sm border-none bg-gray-50 rounded-2xl focus:ring-2 focus:ring-gray-900/5 focus:bg-white transition-all shadow-sm"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
            className="px-6 py-4 text-xs font-semibold text-gray-600 border-none bg-gray-50 rounded-2xl focus:ring-2 focus:ring-gray-900/5 focus:bg-white transition-all shadow-sm"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="officer">Officer</option>
            <option value="citizen">Citizen</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="px-6 py-4 text-xs font-semibold text-gray-600 border-none bg-gray-50 rounded-2xl focus:ring-2 focus:ring-gray-900/5 focus:bg-white transition-all shadow-sm"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {isFiltered && (
            <button
              onClick={() => { setSearchQuery(""); setRoleFilter("all"); setStatusFilter("all"); }}
              className="px-6 py-4 text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-300">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
            <span className="text-xs font-semibold">Loading accounts...</span>
          </div>
        ) : loadError ? (
          <div className="bg-white border border-gray-50 rounded-[2.5rem] p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" strokeWidth={2.5}/></svg>
            </div>
            <p className="text-gray-900 font-semibold mb-8 text-xl">{loadError}</p>
            <button
              onClick={loadUsers}
              className="px-10 py-3.5 bg-gray-900 hover:bg-black text-white text-[11px] font-semibold rounded-full transition-all active:scale-95 shadow-md"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
            <EmptyState filtered={isFiltered} />
          </div>
        ) : (
          <>
            {isFiltered && (
              <p className="text-[11px] font-normal text-gray-400 mb-6 ml-4">
                Showing {filtered.length} of {users.length} results
              </p>
            )}

            {/* Desktop Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 p-10 overflow-hidden hidden sm:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-normal text-gray-400 border-b border-gray-50">
                    <th className="px-6 pb-6">Account</th>
                    <th className="px-6 pb-6">Role</th>
                    <th className="px-6 pb-6">Status</th>
                    <th className="px-6 pb-6">Joined</th>
                    <th className="px-6 pb-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {filtered.map((u) => (
                    <tr key={u.userId} className="group hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0 text-white text-xs font-semibold border-2 border-white shadow-sm">
                            {u.username.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate leading-tight">{u.username}</p>
                            <p className="text-[11px] font-normal text-gray-400 truncate mt-0.5">{u.email}</p>
                          </div>
                          {!u.isEmailVerified && (
                            <span className="hidden lg:inline-block text-[9px] font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100/50">
                              Unverified
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-8">
                        <RoleBadge role={u.role} />
                      </td>

                      <td className="px-6 py-8">
                        <StatusBadge isActive={u.isActive} />
                      </td>

                      <td className="px-6 py-8 text-gray-400 text-[11px] font-normal">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="px-6 py-8 text-right">
                        <button
                          onClick={() => setPendingDelete(u)}
                          disabled={u.role === "admin"}
                          className="inline-flex items-center gap-2 px-6 py-2 text-[11px] font-semibold rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-20"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card list */}
            <div className="sm:hidden space-y-4">
              {filtered.map((u) => (
                <div key={u.userId} className="bg-white rounded-[2rem] border border-gray-50 shadow-sm p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0 text-white font-semibold shadow-sm border-2 border-white">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate leading-tight">{u.username}</p>
                        <p className="text-xs font-normal text-gray-400 truncate mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <RoleBadge role={u.role} />
                    <StatusBadge isActive={u.isActive} />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <p className="text-[11px] font-normal text-gray-300">
                      Joined {formatDate(u.createdAt)}
                    </p>
                    <button
                      onClick={() => setPendingDelete(u)}
                      disabled={u.role === "admin"}
                      className="p-2.5 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-20 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDeleteDialog
          user={pendingDelete}
          deleting={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { if (!deleting) setPendingDelete(null); }}
        />
      )}

      {toastMsg && (
        <div
          role="status"
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl text-sm font-semibold text-white animate-in slide-in-from-bottom-5 duration-300
            ${toastMsg.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
        >
          {toastMsg.type === "success" ? (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          {toastMsg.text}
        </div>
      )}
    </>
  );
}
