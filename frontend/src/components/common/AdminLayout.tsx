// frontend/src/components/common/AdminLayout.tsx

import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

const NAV_ITEMS = [
    { label: "Dashboard", path: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { label: "Accounts", path: "/admin/users", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { label: "Centers", path: "/admin/service-centers", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { label: "Counters", path: "/admin/counters", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="flex h-screen bg-[#F0F2F5] font-sans overflow-hidden">
            {/* SIDEBAR - ACRU STYLE */}
            <aside 
                className={`bg-white h-full border-r border-gray-200 transition-all duration-500 ease-in-out flex flex-col relative z-50 ${isCollapsed ? 'w-[100px]' : 'w-[280px]'}`}
            >
                {/* Logo */}
                <div className="p-8 pb-10 flex items-center gap-3 overflow-hidden whitespace-nowrap">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 shrink-0 flex items-center justify-center">
                        <div className="w-5 h-5 bg-white rounded-sm rotate-45"></div>
                    </div>
                    {!isCollapsed && (
                        <span className="text-2xl font-semibold tracking-tighter text-gray-900">Admin</span>
                    )}
                </div>

                {/* NAV */}
                <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative overflow-hidden ${isActive ? 'bg-[#F2F4F7] text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                            >
                                <svg className={`w-6 h-6 shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                </svg>
                                {!isCollapsed && (
                                    <span className={`text-[15px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                )}
                                {isActive && !isCollapsed && (
                                    <motion.div layoutId="acru-nav-bar" className="absolute left-0 w-1.5 h-6 bg-gray-900 rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>



                {/* COLLAPSE BUTTON */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-8 border-t border-gray-50 flex items-center gap-4 text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <svg className={`w-5 h-5 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
                    {!isCollapsed && <span className="text-[13px] font-normal tracking-tight">Collapse sidebar</span>}
                </button>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F3F4F6]">
                {/* TOP BAR */}
                <header className="h-[100px] px-10 flex items-center justify-between shrink-0 bg-transparent">
                    {/* Search */}
                    <div className="relative group flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-300 group-focus-within:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Quick search" 
                            className="w-full bg-white h-[56px] pl-14 pr-8 rounded-2xl border-none text-[15px] font-medium text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Profile Area */}
                        <div className="flex items-center gap-3 group/profile relative">
                            <div className="flex flex-col items-end mr-1">
                                <span className="text-[14px] font-semibold text-gray-900 leading-none">{user?.username || 'Administrator'}</span>
                                <span className="text-[12px] font-normal text-gray-400 mt-1 tracking-tight">{user?.role || 'Admin'} panel</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center text-white border border-gray-100 shadow-sm font-semibold text-sm relative group-hover/profile:bg-red-500 transition-all cursor-pointer" onClick={handleLogout}>
                                <span className="group-hover/profile:hidden">{user?.username?.charAt(0) || 'A'}</span>
                                <svg className="w-5 h-5 hidden group-hover/profile:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>
                            </div>
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE MAIN */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto px-10 pb-10 min-h-0 relative" data-lenis-prevent>
                    <div className="max-w-[1700px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
