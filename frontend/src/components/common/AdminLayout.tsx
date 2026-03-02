import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const currentPath = location.pathname;

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

            {/* ── Main Content ── */}
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
