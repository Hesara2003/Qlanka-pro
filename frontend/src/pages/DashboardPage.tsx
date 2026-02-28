import { Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { tokenApi, UserToken } from "../api/tokenApi";
import { UserTokenCard } from "../components/dashboard/UserTokenCard";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);

  useEffect(() => {
    if (user) {
      tokenApi.getMyTokens()
        .then(data => {
          setTokens(data);
          setLoadingTokens(false);
        })
        .catch(err => {
          console.error("Failed to fetch tokens:", err);
          setLoadingTokens(false);
        });
    }
  }, [user]);

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

      <div style={{ width: "100%", maxWidth: "1200px", marginTop: "2rem", padding: "0 1rem" }}>
        <h2 style={{ color: "#1a1a2e", marginBottom: "1rem", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>
          My Tokens
        </h2>
        {loadingTokens ? (
          <p style={{ color: "#6b7280" }}>Loading tokens...</p>
        ) : tokens.length === 0 ? (
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "12px", border: "1px dashed #cbd5e1", textAlign: "center" }}>
            <p style={{ color: "#64748b", margin: 0 }}>You have no active tokens right now.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem"
            }}
          >
            {tokens.map((token) => (
              <UserTokenCard key={token.tokenId} token={token} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
