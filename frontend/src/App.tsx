import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ServiceCentersPage from "./pages/ServiceCentersPage";
import BookingPage from "./pages/BookingPage";
import AdminCreateServiceCenterPage from "./pages/AdminCreateServiceCenterPage";
import AdminUsersPage from "./pages/AdminUsersPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/service-centers" element={<ServiceCentersPage />} />
      <Route path="/book/:centerId" element={<BookingPage />} />
      <Route path="/admin/service-centers/create" element={<AdminCreateServiceCenterPage />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
    </Routes>
  );
}

export default App
