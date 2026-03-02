import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllServiceCenters } from "../api/serviceCenterApi";
import { getAdminUsers } from "../api/userApi";
import AppNavbar from "../components/common/AppNavbar";

interface Stats {
  centers: number;
  users: number;
  activeUsers: number;
}

// ── Quick-action card data ──────────────────────────────────────────────────
const ACTIONS = [
  {
    to: "/admin/users",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20H7a4 4 0 01-4-4v-1a6 6 0 016-6h6a6 6 0 016 6v1a4 4 0 01-4 4zM12 11a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
    label: "Manage Users",
    description: "View, filter and deactivate user accounts.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100 hover:border-purple-300",
  },
  {
    to: "/admin/service-centers/create",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 4v16m8-8H4" />
      </svg>
    ),
    label: "Create Service Center",
    description: "Register a new government service center.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100 hover:border-blue-300",
  },
  {
    to: "/service-centers",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m0 0h10M5 21H3m16 0h2M9 7h6M9 11h6M9 15h4" />
      </svg>
    ),
    label: "View Service Centers",
    description: "Browse all registered service centers.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100 hover:border-emerald-300",
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [centers, users] = await Promise.all([
          getAllServiceCenters(),
          getAdminUsers(),
        ]);
        if (!cancelled) {
          setStats({
            centers: centers.length,
            users: users.length,
            activeUsers: users.filter((u) => u.isActive).length,
          });
        }
      } catch {
        if (!cancelled) setStats({ centers: 0, users: 0, activeUsers: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600 mb-1">Admin Dashboard</p>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.username} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's an overview of the QueueLanka system.
          </p>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            label="Service Centers"
            value={stats?.centers}
            loading={loading}
            icon={
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
              </svg>
            }
            iconBg="bg-blue-50"
          />
          <StatCard
            label="Registered Users"
            value={stats?.users}
            loading={loading}
            icon={
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M17 20H7a4 4 0 01-4-4v-1a6 6 0 016-6h6a6 6 0 016 6v1a4 4 0 01-4 4z" />
              </svg>
            }
            iconBg="bg-purple-50"
          />
          <StatCard
            label="Active Users"
            value={stats?.activeUsers}
            loading={loading}
            icon={
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            iconBg="bg-emerald-50"
          />
        </div>

        {/* ── Quick Actions ── */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className={`group flex flex-col gap-4 bg-white rounded-xl border p-5 shadow-sm transition-all duration-150 ${action.border}`}
              >
                <div className={`w-10 h-10 rounded-lg ${action.bg} flex items-center justify-center ${action.color}`}>
                  {action.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                    {action.description}
                  </p>
                </div>
                <span className={`text-xs font-medium ${action.color} flex items-center gap-1`}>
                  Go
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── System status ── */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-3 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">System operational.</span>{" "}
            All services are running normally.
          </p>
        </div>

      </main>
    </div>
  );
}

// ── Stat card sub-component ─────────────────────────────────────────────────
function StatCard({
  label,
  value,
  loading,
  icon,
  iconBg,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {loading ? (
          <div className="h-6 w-10 bg-gray-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
        )}
      </div>
    </div>
  );
}
