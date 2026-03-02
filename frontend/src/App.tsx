import { Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ServiceCentersPage from "./pages/ServiceCentersPage";
import BookingPage from "./pages/BookingPage";
import AdminCreateServiceCenterPage from "./pages/AdminCreateServiceCenterPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";

function App() {
  return (
    <Routes>
      {/* ── Public routes ─────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Protected: any authenticated user ─────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/service-centers" element={<ServiceCentersPage />} />
        <Route path="/book/:centerId" element={<BookingPage />} />
      </Route>

      {/* ── Admin-only routes ─────────────────────────────── */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/service-centers/create" element={<AdminCreateServiceCenterPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Route>

      {/* ── Catch-all → landing ───────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App
