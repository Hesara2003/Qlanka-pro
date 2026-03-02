import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllServiceCenters } from "../api/serviceCenterApi";
import { getAdminUsers } from "../api/userApi";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

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

const ACTIVITY_DATA = [
  { name: 'Mon', active: 400, tokens: 240 },
  { name: 'Tue', active: 300, tokens: 139 },
  { name: 'Wed', active: 550, tokens: 980 },
  { name: 'Thu', active: 278, tokens: 390 },
  { name: 'Fri', active: 189, tokens: 480 },
  { name: 'Sat', active: 239, tokens: 380 },
  { name: 'Sun', active: 349, tokens: 430 },
];

const ROLE_DATA = [
  { name: 'Citizens', users: 850, fill: '#3b82f6' },
  { name: 'Officers', users: 120, fill: '#10b981' },
  { name: 'Admins', users: 30, fill: '#f59e0b' },
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
    <>
      {/* ── Main Content ── */}
      <div className="px-10 py-8">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Analytics</h1>
              <p className="text-sm text-gray-400 font-medium mt-0.5">Welcome back, {user?.username}</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold ring-4 ring-white shadow-sm border border-gray-100">
            {user?.username?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* ── 4 Stat Cards Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          {/* Card 1: Service Centers */}
          <div className="bg-[#f8f9fb] border-[2px] border-dashed border-gray-200 rounded-3xl p-5 flex flex-col justify-between group hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-bold text-gray-900 text-[15px] leading-snug">Service<br />Centers</h3>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">QueueLanka</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">SC</div>
              <div className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
                {loading ? "—" : stats?.centers}
              </div>
            </div>
          </div>

          {/* Card 2: Registered Users */}
          <div className="bg-[#f8f9fb] border-[2px] border-dashed border-gray-200 rounded-3xl p-5 group hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20H7a4 4 0 01-4-4v-1a6 6 0 016-6h6a6 6 0 016 6v1a4 4 0 01-4 4z" /></svg>
              </div>
              <h3 className="font-bold text-gray-900 text-[15px]">Registered Users</h3>
            </div>
            <div className="h-10 w-full mb-3">
              <svg viewBox="0 0 100 30" className="w-full h-full text-blue-400" preserveAspectRatio="none">
                <path d="M0 25 L10 20 L20 28 L30 15 L40 22 L50 10 L60 18 L70 5 L80 15 L90 5 L100 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-[28px] font-extrabold text-gray-900 leading-none">
                {loading ? "—" : stats?.users}
              </span>
              <span className="text-[11px] font-bold bg-black text-white px-2.5 py-1 rounded-full">Total</span>
            </div>
          </div>

          {/* Card 3: Active Accounts */}
          <div className="bg-white shadow-sm border border-gray-100 rounded-3xl p-5 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 text-[15px] mb-0.5">Active Accounts</h3>
              <p className="text-blue-500 text-xs font-bold uppercase tracking-wide">In System</p>
            </div>
            <span className="text-[36px] font-extrabold text-gray-900 leading-none">
              {loading ? "—" : stats?.activeUsers}
            </span>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mt-3">
              Currently Active Members
            </p>
          </div>

          {/* Card 4: System Status */}
          <div className="bg-gradient-to-br from-[#1c64b0] to-[#144886] rounded-3xl p-5 text-white relative shadow-lg shadow-blue-500/20 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-3 right-4 opacity-20">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.8-6.3 4.8 2.3-7.4-6-4.6h7.6z" /></svg>
            </div>
            <div>
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">System Status</p>
              <span className="text-[22px] font-extrabold leading-tight">Operational</span>
            </div>
            <div className="mt-4">
              <p className="text-[13px] font-semibold text-white/80 leading-snug mb-4">
                All services running normally.
              </p>
              <button onClick={() => window.location.reload()} className="bg-black/40 hover:bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors">
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Main Area Chart (2/3 width) */}
          <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">Platform Activity</h3>
                <p className="text-[12px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Last 7 Days</p>
              </div>
              <div className="flex gap-4 text-[12px] font-bold">
                <div className="flex items-center gap-1.5 text-blue-600"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Active Accounts</div>
                <div className="flex items-center gap-1.5 text-emerald-600"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Tokens Issued</div>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '13px' }}
                    labelStyle={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="tokens" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Bar Chart (1/3 width) */}
          <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">System Distribution</h3>
              <p className="text-[12px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Registered Roles</p>
            </div>
            <div className="flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ROLE_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '13px', color: '#111827' }}
                  />
                  <Bar dataKey="users" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
