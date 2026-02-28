import { Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { tokenApi } from "../api/tokenApi";
import type { UserToken } from "../api/tokenApi";
import { UserTokenCard } from "../components/dashboard/UserTokenCard";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      tokenApi.getMyTokens()
        .then(data => {
          setTokens(data);
          setError(null);
        })
        .catch((err: Error) => {
          console.error("Failed to fetch tokens:", err);
          setError(err.message);
        })
        .finally(() => {
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

        {error ? (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "1.5rem", borderRadius: "12px", border: "1px solid #fecaca", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>Failed to Load Tokens</h3>
            <p style={{ margin: 0, fontSize: "0.95rem" }}>{error}</p>
          </div>
        ) : loadingTokens ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem", background: "#fff", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <div style={{ width: "40px", height: "40px", border: "4px solid #e5e7eb", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
            <p style={{ color: "#6b7280", margin: 0, fontWeight: 500 }}>Fetching your queue positions...</p>
            <style>
              {`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        ) : tokens.length === 0 ? (
          <div style={{ background: "#fff", padding: "3rem", borderRadius: "12px", border: "1px dashed #cbd5e1", textAlign: "center" }}>
            <svg style={{ width: "64px", height: "64px", color: "#cbd5e1", margin: "0 auto 1rem auto" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#475569" }}>No Active Tokens</h3>
            <p style={{ color: "#64748b", margin: 0 }}>You aren't queued up for any services right now.</p>
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
