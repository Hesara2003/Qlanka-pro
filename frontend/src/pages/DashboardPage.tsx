import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Segoe UI, system-ui, sans-serif",
        background: "#f4f6fb",
        gap: "1rem",
      }}
    >
      <h1 style={{ color: "#1a1a2e" }}>Welcome, {user.username}!</h1>
      <p style={{ color: "#6b7280" }}>
        Role: <strong>{user.role}</strong>
      </p>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <Link
          to="/service-centers"
          style={{
            padding: "0.6rem 1.5rem",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95rem",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          View Service Centers
        </Link>
        <button
          onClick={logout}
          style={{
            padding: "0.6rem 1.5rem",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
