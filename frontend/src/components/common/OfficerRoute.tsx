// frontend/src/components/common/OfficerRoute.tsx

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Requires the user to be authenticated AND have role = "officer" or "admin".
 * Not logged in → /login
 * Logged in but wrong role → /dashboard
 */
export default function OfficerRoute() {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== "officer" && user.role !== "admin") return <Navigate to="/dashboard" replace />;

    return <Outlet />;
}
