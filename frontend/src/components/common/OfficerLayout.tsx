import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

const NAV_ITEMS = [
    { label: "Dashboard", path: "/officer", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
];

export default function OfficerLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="flex h-screen bg-[#f8f9fb] font-sans overflow-hidden">
            {/* SIDEBAR */}
            <aside className="w-[280px] bg-white border-r border-[#f1f1f1] flex flex-col p-6 shrink-0 relative z-30">
                {/* Logo */}
                <div onClick={() => navigate('/officer')} className="flex items-center gap-3 mb-12 px-2 cursor-pointer group">
                    <div className="w-10 h-10 rounded-full border-4 border-gray-900 group-hover:scale-110 transition-transform flex items-center justify-center p-1.5 shadow-sm">
                        <div className="w-full h-full bg-gray-900 rounded-full grid grid-cols-2 grid-rows-2">
                           <div className="border-r border-b border-white/20"></div>
                           <div className="border-b border-white/20"></div>
                           <div className="border-r border-white/20"></div>
                           <div></div>
                        </div>
                    </div>
                </div>

                {/* NAV */}
                <nav className="flex-1 flex flex-col gap-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative overflow-hidden ${isActive ? 'bg-[#f4f4f4] text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                            >
                                <svg className={`w-5 h-5 shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
                                </svg>
                                <span className={`text-[13px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                {isActive && (
                                    <motion.div layoutId="pill-active" className="absolute left-0 w-1.5 h-6 bg-gray-900 rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* BOTTOM TOOLS */}
                <div className="mt-auto flex flex-col gap-4 border-t border-gray-50 pt-6">
                   <div className="flex flex-col gap-1 px-4">
                       <button onClick={handleLogout} className="flex items-center gap-4 text-gray-400 hover:text-red-500 py-2 transition-colors">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                           <span className="text-[13px] font-bold">Log Out</span>
                       </button>
                       <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-full w-fit">
                            <button className="p-2 rounded-full bg-white shadow-sm text-gray-900"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg></button>
                            <button className="p-2 rounded-full text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg></button>
                       </div>
                   </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* TOP BAR */}
                <header className="h-[80px] px-10 flex items-center justify-between shrink-0 bg-transparent">
                    <h1 className="text-3xl font-bold tracking-tighter text-gray-900">Dashboard</h1>
                    
                    <div className="flex items-center gap-6">
                        {/* Search Pill */}
                        <div className="relative group">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                            <input 
                                type="text" 
                                placeholder="Search anything..." 
                                className="h-12 w-[340px] bg-white border border-transparent hover:border-gray-200 focus:border-gray-900 rounded-full pl-12 pr-6 text-sm outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* WORKSTATION TICKET BUTTON */}
                        <button 
                            className="h-12 px-8 bg-gray-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-black/10 flex items-center gap-2"
                        >
                            Create
                        </button>

                        {/* ICONS */}
                        <div className="flex items-center gap-4">
                            <button className="p-3 text-gray-400 hover:text-gray-600 relative">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                            </button>
                            <button className="p-3 text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                            </button>
                        </div>

                        {/* Profile */}
                        <div className="flex items-center gap-1 p-1 pr-4 bg-white rounded-full border border-gray-100 shadow-sm group cursor-pointer hover:border-gray-200 transition-all">
                             <div className="w-9 h-9 rounded-full bg-emerald-500 overflow-hidden flex items-center justify-center text-white border-2 border-white shadow-sm font-black text-xs">
                                {user?.username?.charAt(0).toUpperCase()}
                             </div>
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE MAIN */}
                <main 
                    className="flex-1 overflow-x-hidden overflow-y-auto px-10 pb-10 min-h-0"
                    data-lenis-prevent
                >
                    <div className="max-w-[1700px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
