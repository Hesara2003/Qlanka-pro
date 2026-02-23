import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/authApi";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus]   = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");

  // Prevent double-invocation in StrictMode
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link. Please use the link sent to your email.");
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err: unknown) => {
        setStatus("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Verification failed. The link may have expired or already been used."
        );
      });
  }, [searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Segoe UI, system-ui, sans-serif",
        background: "#f4f6fb",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "2.5rem 2rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {status === "loading" && (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                border: "4px solid #e5e7eb",
                borderTopColor: "#4f46e5",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 1.25rem",
              }}
            />
            <p style={{ color: "#6b7280", margin: 0 }}>Verifying your email…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h1 style={{ color: "#1a1a2e", fontSize: "1.4rem", marginBottom: "0.5rem" }}>
              Email Verified!
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>{message}</p>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                padding: "0.65rem 1.75rem",
                background: "#4f46e5",
                color: "#fff",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              Sign in
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
            <h1 style={{ color: "#1a1a2e", fontSize: "1.4rem", marginBottom: "0.5rem" }}>
              Verification Failed
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>{message}</p>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                padding: "0.65rem 1.75rem",
                background: "#4f46e5",
                color: "#fff",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
