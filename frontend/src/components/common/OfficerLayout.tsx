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
                   </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* TOP BAR */}
                <header className="h-[80px] px-10 flex items-center justify-between shrink-0 bg-transparent">
                    <h1 className="text-3xl font-bold tracking-tighter text-gray-900">Dashboard</h1>
                    
                    <div className="flex items-center gap-6">
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
