// frontend/src/components/common/AdminRoute.tsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Requires the user to be authenticated AND have role = "admin".
 * Not logged in → /login
 * Logged in but not admin → /dashboard
 */
export default function AdminRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="inline-block w-8 h-8 rounded-full border-4 border-black/20 border-t-black animate-spin" />
      </div>
    );
  }

  if (!user) {
    const returnUrl = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  if (user.role.toLowerCase() !== "admin") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
