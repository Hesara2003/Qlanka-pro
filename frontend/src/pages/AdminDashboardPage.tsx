import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllServiceCenters } from "../api/serviceCenterApi";
import { getAdminUsers } from "../api/userApi";

interface Stats {
  centers: number;
  users: number;
  activeUsers: number;
}

const ACTIONS = [
  {
    to: "/admin/users",
    icon: (
      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20H7a4 4 0 01-4-4v-1a6 6 0 016-6h6a6 6 0 016 6v1a4 4 0 01-4 4zM12 11a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
    label: "Manage Users",
    description: "View, filter and deactivate account",
    type: "Administration",
    status: "Active",
    statusBg: "bg-emerald-100 text-emerald-600",
  },
  {
    to: "/admin/service-centers/create",
    icon: (
      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 4v16m8-8H4" />
      </svg>
    ),
    label: "Create Service Center",
    description: "Register a new service center",
    type: "Management",
    status: "Action",
    statusBg: "bg-orange-100 text-orange-600",
  },
  {
    to: "/admin/service-centers",
    icon: (
      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m0 0h10M5 21H3m16 0h2M9 7h6M9 11h6M9 15h4" />
      </svg>
    ),
    label: "View Service Centers",
    description: "Browse registered service centers",
    type: "Directory",
    status: "Active",
    statusBg: "bg-emerald-100 text-emerald-600",
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <>
      {/* ── Main Content ── */}
      <div className="px-10 py-8">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Analytics</h1>

            {/* Toggle Switch */}
            <div className="hidden sm:flex bg-gray-200/50 p-1 rounded-full items-center">
              <button className="bg-white shadow-sm text-gray-900 px-5 py-2 rounded-full text-xs font-bold tracking-wide">
                Full Statistics
              </button>
              <button className="text-gray-500 hover:text-gray-700 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors">
                Results Summary
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 shadow-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden ring-4 ring-white shadow-sm border border-gray-100">
              {user?.username?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        <p className="text-sm font-medium text-gray-500 mb-6 hidden">Welcome back, {user?.username} 👋</p>

        {/* 4 Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

          {/* Card 1: Service Centers (Dashed border) */}
          <div className="bg-[#f8f9fb] border-[2px] border-dashed border-gray-200 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-gray-300 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-900 text-[16px]">Service <br /> Centers</h3>
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  QueueLanka
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between mt-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-[#f8f9fb] bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 z-30">SC</div>
              </div>
              <div className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                Total: {loading ? "..." : stats?.centers}
              </div>
            </div>
          </div>

          {/* Card 2: Registered Users (Dashed border, Sparkline) */}
          <div className="bg-[#f8f9fb] border-[2px] border-dashed border-gray-200 rounded-3xl p-5 relative overflow-hidden group hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20H7a4 4 0 01-4-4v-1a6 6 0 016-6h6a6 6 0 016 6v1a4 4 0 01-4 4z" /></svg>
              </div>
              <h3 className="font-bold text-gray-900 text-[16px]">Registered Users</h3>
            </div>
            <div className="h-12 w-full mb-3 px-2">
              <svg viewBox="0 0 100 30" className="w-full h-full text-blue-400 drop-shadow-sm" preserveAspectRatio="none">
                <path d="M0 25 L10 20 L20 28 L30 15 L40 22 L50 10 L60 18 L70 5 L80 15 L90 5 L100 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-end justify-between px-1">
              <span className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-none">
                {loading ? "..." : stats?.users}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold bg-black text-white px-2.5 py-1 rounded-full shadow-sm">
                System Total
              </span>
            </div>
          </div>

          {/* Card 3: Active Users (Solid white, Bar chart) */}
          <div className="bg-white shadow-sm border border-gray-100 rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-[16px] mb-1">Active Accounts</h3>
              <p className="text-blue-500 text-sm font-bold">In System</p>
            </div>
            <div className="flex items-center justify-center h-16 gap-3 mt-4 mb-2">
              <span className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none text-center block">
                {loading ? "..." : stats?.activeUsers}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-gray-400 font-bold uppercase tracking-wide px-1">
              <span className="text-center w-full">Currently Active Members</span>
            </div>
          </div>
        </div>

        {/* Card 4: System Status (blue gradient) */}
        <div className="bg-gradient-to-br from-[#1c64b0] to-[#144886] rounded-3xl p-6 text-white relative shadow-lg shadow-blue-500/20 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 p-5 opacity-40 text-blue-100">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.8-6.3 4.8 2.3-7.4-6-4.6h7.6z" /></svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[28px] font-extrabold tracking-tight leading-none drop-shadow-sm">Operational</span>
            </div>
            <p className="text-blue-100 text-xs font-semibold tracking-wide uppercase">System Status</p>
          </div>
          <div className="mt-4 mb-4">
            <p className="text-[15px] font-bold leading-snug tracking-tight text-white/90">
              All services are <br /> running normally.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <button onClick={() => window.location.reload()} className="bg-black text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-900 transition-colors shadow-sm">
              Refresh Status
            </button>
          </div>

        </div>

        {/* Recently Payments Cards (Wait, I used the horizontal card space here) */}
        <div className="mb-6">
          <h2 className="text-[17px] font-bold text-gray-900 tracking-tight mb-4">Quick Shortcuts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/admin/users" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-200 flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20H7a4 4 0 01-4-4v-1a6 6 0 016-6h6a6 6 0 016 6v1a4 4 0 01-4 4zM12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-[15px] leading-snug">Manage Users</h4>
                  <p className="text-xs text-gray-400 font-medium">Administration</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-bold bg-[#e8f5fb] text-[#2c91b5] px-2.5 py-1 rounded-full">Go</span>
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            <Link to="/admin/service-centers/create" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-200 flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-[15px] leading-snug">Create Center</h4>
                  <p className="text-xs text-gray-400 font-medium">Management</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-bold bg-[#fff0e6] text-[#b96b34] px-2.5 py-1 rounded-full">Go</span>
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Transactions Table Style for Quick Actions */}
        <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">System Navigation Modules</h2>
          </div>

          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[12px] font-bold text-gray-400">
                <th className="px-5 pb-2 tracking-wide font-bold">Module name</th>
                <th className="px-5 pb-2 tracking-wide font-bold">Module type</th>
                <th className="px-5 pb-2 tracking-wide font-bold">Status</th>
                <th className="px-5 pb-2 tracking-wide font-bold">Description</th>
                <th className="px-5 pb-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {ACTIONS.map((action, idx) => (
                <tr key={idx} className="group">
                  <td className="px-5 py-4 bg-transparent border-b border-gray-100 group-hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0 p-1">
                        {action.icon}
                      </div>
                      <span className="font-bold text-gray-900 text-[14px]">{action.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 bg-transparent border-b border-gray-100 group-hover:bg-gray-50/50 transition-colors text-[14px] font-medium text-gray-600">
                    {action.type}
                  </td>
                  <td className="px-5 py-4 bg-transparent border-b border-gray-100 group-hover:bg-gray-50/50 transition-colors">
                    <span className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full ${action.statusBg}`}>
                      {action.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 bg-transparent border-b border-gray-100 group-hover:bg-gray-50/50 transition-colors text-[14px] font-medium text-gray-900 max-w-[200px] truncate">
                    {action.description}
                  </td>
                  <td className="px-5 py-4 bg-transparent border-b border-gray-100 group-hover:bg-gray-50/50 transition-colors text-right">
                    <Link to={action.to} className="inline-block text-[11px] font-bold text-gray-600 bg-white border border-gray-200 px-4 py-1.5 rounded-full hover:bg-gray-50 hover:text-black transition-colors shadow-sm">
                      Enter
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
