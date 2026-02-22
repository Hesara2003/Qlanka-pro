import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/authApi";
import {
  validatePasswordStrict,
} from "../../utils/validation";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import "./AuthForm.css";

interface FormState {
  password: string;
  confirmPassword: string;
}

type FormField = keyof FormState;

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};
  const pwErr = validatePasswordStrict(values.password);
  if (pwErr) errors.password = pwErr;
  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const [params]  = useSearchParams();
  const token     = params.get("token") ?? "";

  const [form, setForm]     = useState<FormState>({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (touched[name as FormField]) {
      const all = validate(updated);
      setErrors((prev) => ({ ...prev, [name]: all[name as keyof FormErrors] }));
    }
    setApiError(null);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const all = validate(form);
    setErrors((prev) => ({ ...prev, [name]: all[name as keyof FormErrors] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!token) {
      setApiError("Reset token is missing. Please use the link from your email.");
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const result = await resetPassword(token, form.password, form.confirmPassword);
      setSuccess(result.message);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Set new password</h1>
        <p className="subtitle">Choose a strong password for your account.</p>

        {apiError && <div className="alert alert-error">{apiError}</div>}
        {success  && (
          <div className="alert alert-success">
            {success} Redirecting to sign in…
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} noValidate>
            {/* New password */}
            <div className="form-group">
              <label htmlFor="password">New password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min 8 chars, upper, lower, digit, symbol"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={touched.password && errors.password ? "input-error" : ""}
                disabled={loading}
                aria-describedby={touched.password && errors.password ? "pwd-error" : undefined}
              />
              {touched.password && errors.password && (
                <span id="pwd-error" className="field-error" role="alert">
                  {errors.password}
                </span>
              )}
              <PasswordStrengthMeter password={form.password} />
            </div>

            {/* Confirm password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your new password"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={touched.confirmPassword && errors.confirmPassword ? "input-error" : ""}
                disabled={loading}
                aria-describedby={touched.confirmPassword && errors.confirmPassword ? "cpwd-error" : undefined}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <span id="cpwd-error" className="field-error" role="alert">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
