import { Navigate, Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTokens } from "../hooks/useTokens";
import { UserTokenCard } from "../components/dashboard/UserTokenCard";

/** Auto-dismissing success toast duration (ms). */
const TOAST_DURATION = 4000;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { tokens, loading: loadingTokens, error, lastUpdated, refresh, cancelToken } =
    useTokens({ pollInterval: 30_000 });

  // ── Success toast ─────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), TOAST_DURATION);
  }, []);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  // ── Cancel handler ────────────────────────────────────────────
  const handleCancelToken = useCallback(async (tokenId: number) => {
    const tokenNumber = tokens.find(t => t.tokenId === tokenId)?.tokenNumber ?? "token";
    await cancelToken(tokenId); // throws on failure — card surfaces the error
    showToast(`Token ${tokenNumber} has been cancelled. Your queue spot has been released.`);
  }, [tokens, cancelToken, showToast]);

  if (!user) return <Navigate to="/login" replace />;

  // ── Last-updated label ────────────────────────────────────────
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

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
      {/* ── Success toast ── */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "1.25rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "#ecfdf5",
            border: "1px solid #6ee7b7",
            borderRadius: "10px",
            padding: "0.75rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            maxWidth: "480px",
            width: "calc(100% - 2rem)",
            animation: "fadeInDown 0.2s ease",
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span style={{ color: "#065f46", fontSize: "0.9rem", fontWeight: 500, flex: 1 }}>
            {toastMessage}
          </span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6ee7b7", padding: "0", lineHeight: 1, fontSize: "1.1rem" }}
            aria-label="Dismiss"
          >
            ✕
          </button>
          <style>{`@keyframes fadeInDown { from { opacity:0; transform:translate(-50%,-8px) } to { opacity:1; transform:translate(-50%,0) } }`}</style>
        </div>
      )}
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
        {/* Section header with live indicator + refresh */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h2 style={{ color: "#1a1a2e", margin: 0 }}>My Tokens</h2>
            {/* Pulsing live dot — visible when not in error state */}
            {!error && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span
                  style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#10b981",
                    display: "inline-block",
                    animation: "livePulse 2s ease-in-out infinite",
                  }}
                />
                <span style={{ color: "#6b7280", fontSize: "0.78rem", fontWeight: 500 }}>LIVE</span>
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {lastUpdatedLabel && (
              <span style={{ color: "#9ca3af", fontSize: "0.78rem" }}>
                Updated {lastUpdatedLabel}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loadingTokens}
              style={{
                padding: "0.35rem 0.85rem",
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: loadingTokens ? "not-allowed" : "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#374151",
                opacity: loadingTokens ? 0.5 : 1,
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>
        <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

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
              <UserTokenCard key={token.tokenId} token={token} onCancel={handleCancelToken} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
