import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllServiceCenters } from "../api/serviceCenterApi";
import { getAdminUsers } from "../api/userApi";
import type { AdminUser } from "../types/user";
import { useAuth } from "../context/AuthContext";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { exportToCsv, exportToPdf } from "../utils/exportUtils";
import type { ServiceCenter } from "../types/serviceCenter";

let _cachedUsers: AdminUser[] = [];
let _cachedCenters: ServiceCenter[] = [];
let _cachePopulated: boolean = false;
let _inflightFetch: Promise<void> | null = null;

const MOCK_CENTERS: ServiceCenter[] = [
  { centerId: 1, name: "Colombo One Stop Center", address: "No. 12, Main Street, Colombo 01", phone: "+94112223344", email: "colombo.center@demo.local", description: "Primary demo center", timezone: "Asia/Colombo", capacity: 150, openingTime: "08:00:00", closingTime: "17:00:00", isActive: true, createdAt: "2026-04-19T13:28:59.276368+00:00", isAvailable: true, averageServiceTimeMinutes: 15 },
  { centerId: 2, name: "Kandy Citizen Service Center", address: "No. 45, Dalada Veediya, Kandy", phone: "+94812234567", email: "kandy.center@qlanka.lk", description: "Central Province public services center", timezone: "Asia/Colombo", capacity: 120, openingTime: "08:00:00", closingTime: "16:30:00", isActive: true, createdAt: "2026-04-19T14:32:14.003667+00:00", isAvailable: true, averageServiceTimeMinutes: 20 },
  { centerId: 3, name: "Galle One Stop Service Center", address: "No. 18, Rampart Street, Galle", phone: "+94912223344", email: "galle.center@qlanka.lk", description: "Southern Province public services center", timezone: "Asia/Colombo", capacity: 110, openingTime: "08:30:00", closingTime: "16:30:00", isActive: true, createdAt: "2026-04-19T14:32:14.003667+00:00", isAvailable: true, averageServiceTimeMinutes: 18 },
  { centerId: 4, name: "Jaffna Public Service Hub", address: "No. 09, Hospital Road, Jaffna", phone: "+94212224455", email: "jaffna.center@qlanka.lk", description: "Northern Province integrated service center", timezone: "Asia/Colombo", capacity: 100, openingTime: "08:00:00", closingTime: "16:00:00", isActive: true, createdAt: "2026-04-19T14:32:14.003667+00:00", isAvailable: true, averageServiceTimeMinutes: 25 },
  { centerId: 5, name: "Kurunegala District Service Center", address: "No. 72, Colombo Road, Kurunegala", phone: "+94372221100", email: "kurunegala.center@qlanka.lk", description: "North Western Province district services", timezone: "Asia/Colombo", capacity: 130, openingTime: "08:00:00", closingTime: "17:00:00", isActive: true, createdAt: "2026-04-19T14:32:14.003667+00:00", isAvailable: true, averageServiceTimeMinutes: 15 },
  { centerId: 6, name: "Batticaloa Citizen Facilitation Center", address: "No. 11, Trinco Road, Batticaloa", phone: "+94652223344", email: "batticaloa.center@qlanka.lk", description: "Eastern Province citizen facilitation", timezone: "Asia/Colombo", capacity: 95, openingTime: "08:30:00", closingTime: "16:00:00", isActive: true, createdAt: "2026-04-19T14:32:14.003667+00:00", isAvailable: true, averageServiceTimeMinutes: 22 },
  { centerId: 7, name: "Anuradhapura E-Services Center", address: "No. 56, Maithripala Senanayake Mawatha, Anuradhapura", phone: "+94252224466", email: "anuradhapura.center@qlanka.lk", description: "North Central Province digital public services", timezone: "Asia/Colombo", capacity: 105, openingTime: "08:00:00", closingTime: "16:30:00", isActive: true, createdAt: "2026-04-19T14:32:14.003667+00:00", isAvailable: true, averageServiceTimeMinutes: 20 },
  { centerId: 8, name: "Matara Divisional Service Center", address: "No. 27, Main Street, Matara", phone: "+94412223355", email: "matara.center@qlanka.lk", description: "Southern coastal district service center", timezone: "Asia/Colombo", capacity: 90, openingTime: "08:30:00", closingTime: "16:30:00", isActive: true, createdAt: "2026-04-19T14:32:14.003667+00:00", isAvailable: true, averageServiceTimeMinutes: 18 }
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<AdminUser[]>(_cachedUsers);
  const [allCenters, setAllCenters] = useState<ServiceCenter[]>(_cachedCenters);

  // Filtering State
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [centerFilter, setCenterFilter] = useState<string>("all");


  function fetchData(force = false, signal?: { cancelled: boolean }) {
    if (_cachePopulated && _cachedCenters.length > 0 && !force) return;

    if (!_inflightFetch) {
      _inflightFetch = (async () => {
        try {
          const [centers, users] = await Promise.all([
            getAllServiceCenters(),
            getAdminUsers(),
          ]);
          _cachedUsers = users;
          _cachedCenters = centers.length > 0 ? centers : MOCK_CENTERS;
          _cachePopulated = true;
        } catch {
          _cachedCenters = MOCK_CENTERS;
        } finally {
          _inflightFetch = null;
        }
      })();
    }


    _inflightFetch.then(() => {
      if (signal?.cancelled) return;
      if (_cachedCenters.length > 0) {
        setAllUsers(_cachedUsers);
        setAllCenters(_cachedCenters);
      } else {
        setAllUsers([]);
        setAllCenters([]);
      }

    });
  }

  useEffect(() => {
    const signal = { cancelled: false };
    fetchData(false, signal);
    return () => { signal.cancelled = true; };
  }, []);

  // ── FILTERING LOGIC ────────────────────────────────────────────────────────
  
  const filteredUsers = allUsers.filter(u => {
    const userDate = new Date(u.createdAt).toISOString().split('T')[0];
    const matchesDate = (!startDate || userDate >= startDate) && (!endDate || userDate <= endDate);
    const matchesCenter = centerFilter === 'all' || u.centerId?.toString() === centerFilter;
    return matchesDate && matchesCenter;
  });

  const filteredCenters = allCenters.filter(c => {
    const centerDate = new Date(c.createdAt).toISOString().split('T')[0];
    const matchesDate = (!startDate || centerDate >= startDate) && (!endDate || centerDate <= endDate);
    const matchesCenter = centerFilter === 'all' || c.centerId.toString() === centerFilter;
    return matchesDate && matchesCenter;
  });

  const isFiltered = startDate !== "" || endDate !== "" || centerFilter !== "all";

  // ── DERIVED DATA (Using Filtered Data) ──────────────────────────────────────

  const citizens = filteredUsers.filter(u => u.role === 'citizen').length;
  const officers = filteredUsers.filter(u => u.role === 'officer').length;
  const admins = filteredUsers.filter(u => u.role === 'admin').length;

  const roleData = [
    { name: 'Citizens', users: citizens, fill: '#111827' },
    { name: 'Officers', users: officers, fill: '#78d64b' },
    { name: 'Admins', users: admins, fill: '#64748b' },
  ];

  // 1. Audit Logs (Filtered)
  const auditLogs = [
    ...filteredUsers.map(u => ({ name: `User Registered: ${u.username}`, date: new Date(u.createdAt), val: 'Auth', status: 'Success', icon: '👤', color: 'text-emerald-500' })),
    ...filteredCenters.map(c => ({ name: `Center Created: ${c.name}`, date: new Date(c.createdAt), val: 'Infra', status: 'Success', icon: '🏦', color: 'text-blue-500' }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);

  // 2. Capacity Growth Trend (Filtered)
  const sortedCentersByDate = [...filteredCenters].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  let cumulativeCapacity = 0;
  const capacityTrend = sortedCentersByDate.map(c => {
    cumulativeCapacity += c.capacity;
    return { name: new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: cumulativeCapacity };
  });
  const trafficData = capacityTrend.length > 0 ? capacityTrend : [{ name: 'N/A', value: 0 }];

  // 3. Uptime Gauge (Filtered)
  const activeAndAvailable = filteredCenters.filter(c => c.isAvailable && c.isActive).length;
  const uptimeScore = filteredCenters.length > 0 ? Math.round((activeAndAvailable / filteredCenters.length) * 100) : 0;
  const gaugeData = [
    { name: 'Uptime', value: uptimeScore, fill: '#78d64b' },
    { name: 'Remaining', value: 100 - uptimeScore, fill: '#F3F4F6' },
  ];

  // 4. Regional Distribution (Filtered)
  const regions: Record<string, number> = {};
  filteredCenters.forEach(c => {
    const region = c.address.split(',').pop()?.trim() || 'Central';
    regions[region] = (regions[region] || 0) + 1;
  });
  const regionalDemand = Object.entries(regions).map(([name, count]) => ({
    label: name,
    val: count > 3 ? 'High load' : 'Normal',
    icon: '📍',
    color: count > 3 ? 'bg-orange-400' : 'bg-emerald-400',
    percent: (count / (filteredCenters.length || 1)) * 100
  })).slice(0, 3);

  const handleExportActivityCsv = () => {
    const columns = [
      { header: "Event", key: "name" },
      { header: "Category", key: "val" },
      { header: "Status", key: "status" },
      { header: "Date", key: (tx: any) => tx.date.toLocaleDateString() },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(auditLogs, columns, `QueueLanka_Activity_Report_${date}`);
  };

  const handleExportActivityPdf = () => {
    const columns = [
      { header: "Event", key: "name" },
      { header: "Category", key: "val" },
      { header: "Status", key: "status" },
      { header: "Date", key: (tx: any) => tx.date.toLocaleDateString() },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToPdf(auditLogs, columns, "System Activity Report", `QueueLanka_Activity_Report_${date}`);
  };

  return (
    <div className="flex flex-col gap-8 py-2">
      
      {/* ── FILTER BAR ────────────────────────────────────────────────────────── */}
      <section className="bg-white/60 backdrop-blur-md border border-white/40 p-4 rounded-[2rem] shadow-sm flex flex-wrap items-center gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 bg-gray-50/80 px-4 py-2 rounded-2xl border border-gray-100 flex-1 min-w-[200px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Center</span>
          <select 
            value={centerFilter}
            onChange={(e) => setCenterFilter(e.target.value)}
            className="bg-transparent border-none text-[13px] font-semibold text-gray-900 focus:ring-0 w-full cursor-pointer"
          >
            <option value="all">Global System</option>
            {allCenters.map(c => (
              <option key={c.centerId} value={c.centerId}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 bg-gray-50/80 px-4 py-2 rounded-2xl border border-gray-100 flex-1 min-w-[300px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Range</span>
          <div className="flex items-center gap-2 w-full">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-[13px] font-semibold text-gray-900 focus:ring-0 p-0 cursor-pointer"
            />
            <span className="text-gray-300">→</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-[13px] font-semibold text-gray-900 focus:ring-0 p-0 cursor-pointer"
            />
          </div>
        </div>

        <AnimatePresence>
          {isFiltered && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => { setStartDate(""); setEndDate(""); setCenterFilter("all"); }}
              className="px-6 py-3 bg-gray-900 text-white text-[11px] font-bold rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              Reset Filters
            </motion.button>
          )}
        </AnimatePresence>
      </section>

      <div className="grid grid-cols-12 gap-8">
      
      {/* --- MAIN LEFT CONTENT (9 Cols) --- */}
      <div className="col-span-12 xl:col-span-9 flex flex-col gap-8">
        
        {/* ROW 1: Capacity Overview & Stats */}
        <div className="grid grid-cols-12 gap-8">
          {/* Large Trend Card */}
          <section className="col-span-12 lg:col-span-8 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
             <div className="flex justify-between items-start mb-8">
                <div>
                   <h2 className="text-4xl font-semibold text-gray-900 tracking-tighter mb-2">{cumulativeCapacity}</h2>
                   <p className="text-[11px] font-normal text-gray-400">Total system capacity</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                      <span className="text-[10px] font-semibold text-gray-900">Real-time</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   </div>
                </div>
             </div>
             
             <div className="h-[280px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={trafficData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                         <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#111827" stopOpacity={0.05}/>
                            <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#111827" strokeWidth={4} fillOpacity={1} fill="url(#colorTraffic)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </section>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
             {[
                { label: 'Managed centers', value: filteredCenters.length, change: filteredCenters.length === allCenters.length ? '100%' : `${Math.round((filteredCenters.length / (allCenters.length || 1)) * 100)}%`, up: true, desc: 'Visible facilities' },
                { label: 'Global load', value: '1.2k', change: '-12%', up: false, desc: 'Waiting tokens' },
                { label: 'Workforce scale', value: officers, change: filteredUsers.length, up: true, desc: 'Active officers' },
             ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm flex flex-col gap-1 hover:border-gray-200 transition-all cursor-pointer">
                   <p className="text-[10px] font-normal text-gray-400 mb-1">{stat.label}</p>
                   <h3 className="text-3xl font-semibold text-gray-900 tracking-tight leading-none mb-1">{stat.value}</h3>
                   <div className="flex items-center gap-1.5">
                      <svg className={`w-3 h-3 ${stat.up ? 'text-emerald-500' : 'text-orange-500'} ${!stat.up ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M7 11l5-5 5 5H7z"/></svg>
                      <span className={`text-[10px] font-semibold ${stat.up ? 'text-emerald-500' : 'text-orange-500'}`}>{stat.change} <span className="opacity-40 text-gray-400 ml-0.5 font-normal">{stat.desc}</span></span>
                   </div>
                </div>
             ))}
          </div>
        </div>

        {/* ROW 2: Uptime & Insights */}
        <div className="grid grid-cols-12 gap-8">
           <section className="col-span-12 lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative group overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-semibold text-gray-900 tracking-tighter">Infrastructure uptime</h3>
              </div>
              <div className="flex flex-col gap-3">
                 <div className="h-6 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 flex items-center p-1">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: '99%' }}
                       transition={{ duration: 1.5, ease: "circOut" }}
                       className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full flex items-center justify-end px-2"
                    >
                       <div className="w-1.5 h-1.5 bg-white rounded-full scale-150 animate-pulse"></div>
                    </motion.div>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[13px] font-semibold text-gray-900">{uptimeScore}% operational</span>
                    <span className="text-[11px] font-normal text-gray-300 tracking-tight">Active nodes</span>
                 </div>
              </div>
           </section>

           <section className="col-span-12 lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-8 relative group overflow-hidden">
               <div className="flex-1">
                  <h3 className="text-[15px] font-semibold text-gray-900 tracking-tighter mb-2">Operational insight</h3>
                  <p className="text-[11px] font-normal text-gray-400 leading-tight mb-4">Mahanuwara center is currently 15% above peak capacity. Consider redistributing traffic.</p>
               </div>
               <div className="w-24 flex flex-col gap-1 items-end pt-4">
                  {[1,2,3,4].map(row => (
                    <div key={row} className="flex gap-1">
                      {[1,2,3].map(col => (
                        <div key={col} className={`w-3 h-3 rounded-sm ${row + col > 4 ? 'bg-orange-400 opacity-20' : 'bg-orange-400'}`}></div>
                      ))}
                    </div>
                  ))}
               </div>
           </section>
        </div>

        {/* ROW 3: Workforce, SLA, Regions */}
        <div className="grid grid-cols-12 gap-8 mb-4">
            <section className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col group">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[15px] font-semibold text-gray-900 tracking-tighter">Workforce analysis</h3>
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-[9px] font-normal text-gray-400">Total distribution <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth={3}/></svg></div>
               </div>
               <div className="mb-6">
                  <h4 className="text-2xl font-semibold text-gray-900 tracking-tighter mb-4">{filteredUsers.length} Active accounts</h4>
                  <div className="flex h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                     {roleData.map((role, idx) => (
                       <div 
                         key={idx} 
                         className={`h-full border-r-2 border-white`} 
                         style={{ 
                           width: `${filteredUsers.length ? (role.users / filteredUsers.length) * 100 : 0}%`,
                           backgroundColor: role.fill 
                         }} 
                       />
                     ))}
                  </div>
               </div>
               <div className="flex flex-col gap-3">
                  {roleData.map((cat, i) => (
                    <div key={i} className="flex justify-between items-center">
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: cat.fill }}></div>
                          <span className="text-[11px] font-normal text-gray-400 tracking-tight">{cat.name}</span>
                       </div>
                       <span className="text-[11px] font-semibold text-gray-900">{cat.users}</span>
                    </div>
                  ))}
               </div>
            </section>

            <section className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col group overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[15px] font-semibold text-gray-900 tracking-tighter">SLA readiness</h3>
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-[9px] font-normal text-gray-400">Efficiency <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth={3}/></svg></div>
               </div>
               <div className="flex-1 flex flex-col items-center justify-center relative pb-8">
                  <h4 className="text-2xl font-semibold text-gray-900 tracking-tighter mb-1">8.2m Avg.</h4>
                  <div className="flex items-center gap-1 mb-4">
                     <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M7 11l5-5 5 5H7z"/></svg>
                     <span className="text-[10px] font-semibold text-emerald-500 tracking-tight">12% Improvement <span className="opacity-40 text-gray-400 font-normal">vs last week</span></span>
                  </div>
                  
                  <div className="w-full h-32 relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gaugeData}
                            cx="50%" cy="100%"
                            startAngle={180} endAngle={0}
                            innerRadius={60} outerRadius={80}
                            dataKey="value"
                            stroke="none"
                          >
                          </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                        <span className="text-3xl font-semibold text-gray-900 tracking-tighter">{uptimeScore}%</span>
                        <span className="text-[8px] font-normal text-gray-400 -mt-1 ml-1 leading-none">System availability</span>
                     </div>
                  </div>
               </div>
               <p className="text-[9px] font-normal text-gray-300 text-center leading-tight">Calculated across 8 core service clusters in the central region</p>
            </section>

            <section className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col group">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[15px] font-semibold text-gray-900 tracking-tighter">Regional demand</h3>
               </div>
               <div className="flex flex-col gap-6">
                  {regionalDemand.length > 0 ? regionalDemand.map((goal, i) => (
                    <div key={i} className="flex flex-col gap-2">
                       <div className="flex justify-between items-end">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">{goal.icon}</div>
                             <div>
                                <h5 className="text-[13px] font-semibold text-gray-900 leading-tight">{goal.label}</h5>
                                <p className="text-[9px] font-normal text-gray-300">Geographical cluster</p>
                             </div>
                          </div>
                          <span className="text-[11px] font-normal text-gray-400 tracking-tighter">{goal.val}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                          <div className={`h-full ${goal.color}`} style={{ width: `${goal.percent}%` }}></div>
                       </div>
                    </div>
                  )) : (
                    <p className="text-center text-gray-300 font-semibold text-[10px] py-12">No regional data available</p>
                  )}
               </div>
            </section>
        </div>
      </div>

      {/* --- RIGHT SIDEBAR AREA (3 Cols) --- */}
      <div className="col-span-12 xl:col-span-3 flex flex-col gap-8">
         
         {/* SYSTEM CONTROL SECTION */}
         <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-8">
            <div className="flex justify-between items-center">
               <div className="flex flex-col">
                  <h3 className="text-[15px] font-semibold text-gray-900 tracking-tighter leading-none">Control node</h3>
                  <p className="text-[9px] font-normal text-gray-400 mt-1">Admin center</p>
               </div>
            </div>
            
            {/* The Control Card */}
            <div className="w-full h-44 bg-gradient-to-br from-[#111827] to-[#1f2937] rounded-[2rem] p-6 flex flex-col justify-between text-white shadow-xl shadow-slate-200/50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
               <div className="flex justify-between items-start">
                  <span className="text-[10px] font-semibold opacity-80">Root access</span>
                  <span className="text-[15px] font-semibold tracking-tighter">Admin</span>
               </div>
               <div className="flex flex-col gap-1">
                  <p className="text-xl font-semibold tracking-widest tabular-nums font-mono">Admin instance</p>
                  <div className="flex justify-between items-end mt-2">
                     <span className="text-[11px] font-semibold tracking-tight">{user?.username || 'System root'}</span>
                     <span className="text-[11px] font-normal tabular-nums opacity-80 tracking-tighter">v5.0.2</span>
                  </div>
               </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-5 gap-2">
               {[
                 { label: 'Users', icon: '👤', to: '/admin/users' },
                 { label: 'Centers', icon: '🏦', to: '/admin/service-centers' },
                 { label: 'Audit', icon: '📜', to: '/admin' },
                 { label: 'Alerts', icon: '📢', to: '/admin' },
                 { label: 'Setup', icon: '⚙️', to: '/admin' },
               ].map((act, i) => (
                 <Link key={i} to={act.to} className="flex flex-col items-center gap-2">
                    <button className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm hover:bg-gray-100 transition-all shrink-0">{act.icon}</button>
                    <span className="text-[9px] font-normal text-gray-400 tracking-tight scale-90">{act.label}</span>
                 </Link>
               ))}
            </div>

            {/* System Operators (Avatars) */}
            <div className="flex flex-col gap-4 mt-2">
               <div className="flex justify-between items-center text-[10px] font-semibold text-gray-900">
                  <span>Duty officers</span>
               </div>
               <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar">
                  {[
                    { name: 'Davis', col: 'bg-gray-900', initial: 'D' },
                    { name: 'Ellis', col: 'bg-emerald-400', initial: 'E' },
                    { name: 'Leo', col: 'bg-blue-400', initial: 'L' },
                    { name: 'Amanda', col: 'bg-orange-400', initial: 'A' },
                    { name: 'Ann', col: 'bg-pink-400', initial: 'A' },
                  ].map((avatar, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                       <div className={`w-10 h-10 rounded-full ${avatar.col} flex items-center justify-center text-white font-semibold text-xs border-2 border-white shadow-sm ring-1 ring-gray-100`}>{avatar.initial}</div>
                       <span className="text-[9px] font-normal text-gray-400">{avatar.name}</span>
                    </div>
                  ))}
               </div>
            </div>
         </section>

         {/* SYSTEM ACTIVITY SECTION */}
         <section className="flex-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col group min-h-[400px]">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-[15px] font-semibold text-gray-900 tracking-tighter leading-none">System activity</h3>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={handleExportActivityCsv}
                     disabled={auditLogs.length === 0}
                     className="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-emerald-500 transition-all disabled:opacity-30"
                     title="Export CSV"
                   >
                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                   </button>
                   <button 
                     onClick={handleExportActivityPdf}
                     disabled={auditLogs.length === 0}
                     className="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-red-500 transition-all disabled:opacity-30"
                     title="Export PDF"
                   >
                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                   </button>
                   <div className="h-4 w-px bg-gray-100 mx-1"></div>
                   <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-[9px] font-normal text-gray-400">Audit logs <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth={3}/></svg></div>
                </div>
             </div>
             
             <div className="flex flex-col gap-6 overflow-y-auto no-scrollbar pr-1">
                {auditLogs.length > 0 ? auditLogs.map((tx, i) => (
                  <div key={i} className="flex justify-between items-center group/tx cursor-pointer">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg shrink-0 group-hover/tx:bg-gray-100 transition-colors">{tx.icon}</div>
                        <div>
                           <h5 className="text-[13px] font-semibold text-gray-900 leading-none mb-1 group-hover/tx:text-emerald-500 transition-colors tracking-tight truncate max-w-[120px]">{tx.name}</h5>
                           <p className="text-[10px] font-normal text-gray-300">{tx.date.toLocaleDateString()}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className={`text-[13px] font-semibold tabular-nums transition-all ${tx.color}`}>{tx.val}</p>
                        <p className={`text-[9px] font-normal ${tx.status === 'Success' ? 'text-emerald-400' : 'text-orange-400'} opacity-60`}>{tx.status}</p>
                     </div>
                  </div>
                )) : (
                   <p className="text-center text-gray-300 font-semibold text-[10px] py-12">No activity detected</p>
                )}
             </div>
         </section>
      </div>
    </div>
  </div>
);
}
