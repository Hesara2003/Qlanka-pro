import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/authApi";
import "./AuthForm.css";

interface FormErrors {
  email?: string;
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email is required.";
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(email.trim()))
    return "Enter a valid email address (e.g. user@example.com).";
}

export default function ForgotPasswordForm() {
  const [email, setEmail]       = useState("");
  const [touched, setTouched]   = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (touched) setEmailError(validateEmail(e.target.value));
    setApiError(null);
  }

  function handleBlur() {
    setTouched(true);
    setEmailError(validateEmail(email));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setLoading(true);
    setApiError(null);

    try {
      const result = await forgotPassword(email.trim());
      setSuccess(result.message);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Forgot password?</h1>
        <p className="subtitle">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {apiError && <div className="alert alert-error">{apiError}</div>}
        {success  && <div className="alert alert-success">{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={touched && emailError ? "input-error" : ""}
                disabled={loading}
                aria-describedby={touched && emailError ? "email-error" : undefined}
              />
              {touched && emailError && (
                <span id="email-error" className="field-error" role="alert">
                  {emailError}
                </span>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Remembered it? <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
