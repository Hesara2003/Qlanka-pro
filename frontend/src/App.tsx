// frontend/src/App.tsx

import { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Lenis from "lenis";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ServiceCentersPage from "./pages/ServiceCentersPage";
import BookingPage from "./pages/BookingPage";
import LiveQueuePage from "./pages/LiveQueuePage";
import AdminCreateServiceCenterPage from "./pages/AdminCreateServiceCenterPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminServiceCentersPage from "./pages/AdminServiceCentersPage";
import AdminCountersPage from "./pages/AdminCountersPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";
import OfficerRoute from "./components/common/OfficerRoute";
import AdminLayout from "./components/common/AdminLayout";
import OfficerDashboardPage from "./pages/OfficerDashboardPage";
import UserLayout from "./components/common/UserLayout";

function App() {
  useEffect(() => {
    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.8, // Reduced speed for premium feel
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <Routes>
      {/* ── Public routes ─────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Protected: any authenticated user ─────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/service-centers" element={<ServiceCentersPage />} />
          <Route path="/book/:centerId" element={<BookingPage />} />
          <Route path="/queue/:centerId" element={<LiveQueuePage />} />
        </Route>
      </Route>

      {/* ── Admin-only routes ─────────────────────────────── */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/service-centers" element={<AdminServiceCentersPage />} />
          <Route path="/admin/service-centers/create" element={<AdminCreateServiceCenterPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/counters" element={<AdminCountersPage />} />
        </Route>
      </Route>

      {/* ── Officer-only routes ───────────────────────────── */}
      <Route element={<OfficerRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/officer" element={<OfficerDashboardPage />} />
        </Route>
      </Route>

      {/* ── Catch-all → landing ───────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App
