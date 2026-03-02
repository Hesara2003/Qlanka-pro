import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
    "/admin":                          { title: "Dashboard",             subtitle: "Overview of the QueueLanka system" },
    "/admin/users":                    { title: "User Management",        subtitle: "View, search and manage user accounts" },
    "/admin/service-centers":          { title: "Service Centers",        subtitle: "Browse all registered service centers" },
    "/admin/service-centers/create":   { title: "Create Service Center",  subtitle: "Register a new government service center" },
};

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const currentPath = location.pathname;
    const page = PAGE_TITLES[currentPath] ?? { title: "Admin", subtitle: "" };

    return (
        <div className="flex h-screen bg-[#f8f9fb] font-sans selection:bg-teal-200 overflow-hidden">
            {/* ── Sidebar ── */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between py-6 px-4">
                <div>
                    {/* Logo */}
                    <Link to="/admin" className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-sm"></div>
                        </div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight">QueueLanka</span>
                    </Link>

                    {/* MAIN MENU */}
                    <div className="mb-8">
                        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Main Menu</p>
                        <nav className="flex flex-col gap-1">
                            <Link
                                to="/admin"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-colors shadow-sm ${currentPath === "/admin"
                                    ? "bg-gray-50 text-gray-900"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium"
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={currentPath === "/admin" ? 2.5 : 2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Dashboard
                            </Link>
                            <Link
                                to="/admin/users"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors shadow-sm ${currentPath === "/admin/users"
                                    ? "bg-gray-50 text-gray-900 font-bold"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium"
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={currentPath === "/admin/users" ? 2.5 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Users
                            </Link>
                            <Link
                                to="/admin/service-centers"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors shadow-sm ${currentPath === "/admin/service-centers"
                                    ? "bg-gray-50 text-gray-900 font-bold"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium"
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={currentPath === "/admin/service-centers" ? 2.5 : 2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Centers
                            </Link>
                            <Link
                                to="/admin/service-centers/create"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors shadow-sm ${currentPath === "/admin/service-centers/create"
                                    ? "bg-gray-50 text-gray-900 font-bold"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium"
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={currentPath === "/admin/service-centers/create" ? 2.5 : 2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create
                            </Link>
                        </nav>
                    </div>

                    {/* ROLES */}
                    <div>
                        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Roles</p>
                        <nav className="flex flex-col gap-1">
                            <button className="flex items-center gap-3 text-gray-500 hover:text-gray-900 px-3 py-2.5 rounded-xl font-medium transition-colors w-full text-left">
                                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
                                Administrators
                            </button>
                            <button className="flex items-center gap-3 text-gray-500 hover:text-gray-900 px-3 py-2.5 rounded-xl font-medium transition-colors w-full text-left">
                                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></span>
                                Officers
                            </button>
                        </nav>
                    </div>
                </div>

                {/* BOTTOM MENU */}
                <div className="border-t border-gray-100 pt-4 pb-2">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-gray-500 hover:text-red-600 px-3 py-2.5 rounded-xl font-medium transition-colors w-full text-left">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Log Out
                    </button>
                </div>
            </aside>

            {/* ── Main Column (top bar + content) ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* ── Top Bar ── */}
                <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-8 h-16 flex items-center justify-between flex-shrink-0">
                    {/* Page title */}
                    <div className="flex items-center gap-3">
                        {currentPath !== "/admin" && (
                            <button onClick={() => navigate("/admin")} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h2 className="text-[15px] font-bold text-gray-900 leading-none">{page.title}</h2>
                            {page.subtitle && (
                                <p className="text-[11px] text-gray-400 font-medium mt-0.5 leading-none hidden sm:block">{page.subtitle}</p>
                            )}
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2.5">
                        {/* Search */}
                        <div className="relative hidden md:block">
                            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search…"
                                className="pl-8 pr-4 py-2 text-xs font-medium bg-gray-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 text-gray-700 placeholder-gray-400"
                            />
                        </div>

                        {/* Notification bell */}
                        <button className="relative w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>

                        {/* User pill */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5 cursor-default">
                            <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-semibold text-gray-900 leading-none">{user?.username}</p>
                                <p className="text-[10px] text-gray-400 font-medium capitalize leading-none mt-0.5">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Scrollable page content ── */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
