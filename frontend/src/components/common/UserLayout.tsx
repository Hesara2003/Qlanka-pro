import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function UserLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-[#1a1c23]">
            {/* Pill shaped floating navigation bar */}
            <header className="sticky top-4 z-40 px-4 sm:px-6 mb-8 w-full max-w-6xl mx-auto">
                <div className="bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-full h-16 px-6 flex items-center justify-between shadow-sm">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#78d64b] flex items-center justify-center shadow-sm">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M12 2L2 22h20L12 2z" fill="white" stroke="none" />
                            </svg>
                        </div>
                        <span className="font-bold text-[#1a1c23] tracking-tight text-lg hidden sm:block">QueueLanka</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:block text-right leading-tight">
                                    <p className="text-sm font-bold text-[#1a1c23]">{user.username}</p>
                                    <p className="text-[10px] font-bold text-[#0a5c4e] uppercase tracking-widest">{user.role}</p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-[#1a1c23] flex items-center justify-center text-white text-sm font-bold shadow-inner shrink-0">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        )}
                        <div className="h-6 w-px bg-gray-200 mx-1"></div>
                        <button
                            onClick={logout}
                            className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content area */}
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-12">
                <Outlet />
            </main>
        </div>
    );
}
