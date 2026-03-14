import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Requires the user to be authenticated AND have role = "admin".
 * Not logged in → /login
 * Logged in but not admin → /dashboard
 */
export default function AdminRoute() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
