import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function UserLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-[#f8f9fb] flex flex-col">
            {/* Simple, clean navigation bar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            Q
                        </div>
                        <span className="font-bold text-gray-900 tracking-tight text-lg hidden sm:block">QueueLanka</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:block text-right leading-tight">
                                    <p className="text-sm font-bold text-gray-900">{user.username}</p>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{user.role}</p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-inner shrink-0">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={logout}
                            className="ml-2 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content area */}
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
}
