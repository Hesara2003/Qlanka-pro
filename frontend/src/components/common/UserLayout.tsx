import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function UserLayout() {
    const { logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Dashboard", path: "/dashboard" },
        { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", label: "Map", path: "/service-centers" },
        { icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Bookings", path: "/dashboard" }, // Shared with dashboard for now
        { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Profile", path: "/profile" },
    ];

    return (
        <div className="min-h-screen bg-[#050b07] flex font-sans text-white selection:bg-[#78d64b]/30">
            {/* Global Grain Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.08] mix-blend-soft-light" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            {/* Top-Center Emerald Bloom (Brand Alignment) */}
            <div className="fixed top-0 left-0 w-full h-[100%] pointer-events-none z-0" 
                 style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(74, 190, 142, 0.04) 0%, transparent 60%)" }} />

            {/* Fixed Sidebar */}
            <aside className="w-20 hidden md:flex flex-col items-center py-8 border-r border-white/5 relative z-50 bg-[#050b07]">
                <Link to="/dashboard" className="mb-12">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#78d64b] to-[#4abe8e] flex items-center justify-center shadow-lg shadow-[#78d64b]/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                            <path d="M12 2L2 22h20L12 2z" fill="black" stroke="none" />
                        </svg>
                    </div>
                </Link>

                <nav className="flex-1 flex flex-col gap-8">
                    {navItems.map((item) => (
                        <Link 
                            key={item.label} 
                            to={item.path}
                            className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${location.pathname === item.path ? 'bg-white/10 text-[#78d64b]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                            </svg>
                            <span className="absolute left-16 px-2 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </nav>

                <button 
                    onClick={logout}
                    className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                </button>
            </aside>

            {/* Main scrollable area */}
            <main className="flex-1 relative h-screen overflow-y-auto overflow-x-hidden md:pl-0">
                <div className="w-full max-w-[1400px] mx-auto px-6 py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

