// frontend/src/components/common/OfficerRoute.tsx

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Requires the user to be authenticated AND have role = "officer".
 * Not logged in → /login
 * Logged in but wrong role → /dashboard
 */
export default function OfficerRoute() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="inline-block w-8 h-8 rounded-full border-4 border-black/20 border-t-black animate-spin" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== "officer") return <Navigate to="/dashboard" replace />;

    return <Outlet />;
}
