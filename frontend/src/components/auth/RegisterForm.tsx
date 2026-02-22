import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";
import type { RegisterRequest } from "../../types/auth";
import {
  validateEmail,
  validateUsername,
  validatePasswordStrict,
} from "../../utils/validation";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import "./AuthForm.css";

type Role = "citizen" | "officer" | "admin";

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  centerId: string;
}

type FormField = keyof FormState;

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  centerId?: string;
}

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};

  const usernameErr = validateUsername(values.username);
  if (usernameErr) errors.username = usernameErr;

  const emailErr = validateEmail(values.email);
  if (emailErr) errors.email = emailErr;

  const passwordErr = validatePasswordStrict(values.password);
  if (passwordErr) errors.password = passwordErr;

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (values.role === "officer") {
    if (!values.centerId.trim()) {
      errors.centerId = "Centre ID is required for officers.";
    } else if (isNaN(Number(values.centerId))) {
      errors.centerId = "Centre ID must be a number.";
    }
  }

  return errors;
}

export default function RegisterForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "citizen",
    centerId: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    // Re-validate the changed field immediately if already touched
    if (touched[name as FormField]) {
      const all = validate(updated);
      setErrors((prev) => ({ ...prev, [name]: all[name as keyof FormErrors] }));
    }
    setApiError(null);
  }

  function handleBlur(
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const all = validate(form);
    setErrors((prev) => ({ ...prev, [name]: all[name as keyof FormErrors] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Mark every field as touched so all errors become visible
    const allTouched: Partial<Record<FormField, boolean>> = {
      username: true, email: true, password: true,
      confirmPassword: true, role: true, centerId: true,
    };
    setTouched(allTouched);

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError(null);

    const payload: RegisterRequest = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      ...(form.role === "officer" && { centerId: Number(form.centerId) }),
    };

    try {
      const result = await registerUser(payload);
      setSuccess(
        `Account created for ${result.username}! Redirecting to login…`
      );
      setTimeout(() => navigate("/login"), 1800);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="subtitle">Join QueueLanka — skip the queue.</p>

        {apiError && <div className="alert alert-error">{apiError}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="e.g. john_doe"
              value={form.username}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.username && errors.username ? "input-error" : ""}
              disabled={loading}
              aria-describedby={touched.username && errors.username ? "username-error" : undefined}
            />
            {touched.username && errors.username && (
              <span id="username-error" className="field-error" role="alert">{errors.username}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.email && errors.email ? "input-error" : ""}
              disabled={loading}
              aria-describedby={touched.email && errors.email ? "email-error" : undefined}
            />
            {touched.email && errors.email && (
              <span id="email-error" className="field-error" role="alert">{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
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
              aria-describedby={touched.password && errors.password ? "password-error" : undefined}
            />
            {touched.password && errors.password && (
              <span id="password-error" className="field-error" role="alert">{errors.password}</span>
            )}
            {/* Live strength meter — shown as soon as user starts typing */}
            <PasswordStrengthMeter password={form.password} />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.confirmPassword && errors.confirmPassword ? "input-error" : ""}
              disabled={loading}
              aria-describedby={touched.confirmPassword && errors.confirmPassword ? "confirmPassword-error" : undefined}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <span id="confirmPassword-error" className="field-error" role="alert">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Role */}
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            >
              <option value="citizen">Citizen</option>
              <option value="officer">Service Centre Officer</option>
              <option value="admin">Admin</option>
            </select>
            <span className="role-hint">
              Select the role that best describes you.
            </span>
          </div>

          {/* Centre ID — only for officers */}
          {form.role === "officer" && (
            <div className="form-group">
              <label htmlFor="centerId">Centre ID</label>
              <input
                id="centerId"
                name="centerId"
                type="number"
                placeholder="Your service centre ID"
                value={form.centerId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={touched.centerId && errors.centerId ? "input-error" : ""}
                disabled={loading}
                aria-describedby={touched.centerId && errors.centerId ? "centerId-error" : undefined}
              />
              {touched.centerId && errors.centerId && (
                <span id="centerId-error" className="field-error" role="alert">{errors.centerId}</span>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
