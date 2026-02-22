import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";
import type { RegisterRequest } from "../../types/auth";
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

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  centerId?: string;
}

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!values.username.trim()) {
    errors.username = "Username is required.";
  } else if (values.username.length < 3) {
    errors.username = "Username must be at least 3 characters.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (!PASSWORD_REGEX.test(values.password)) {
    errors.password =
      "Min 8 chars — must include uppercase, lowercase, digit and special character.";
  }

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
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setApiError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
              className={errors.username ? "input-error" : ""}
              disabled={loading}
            />
            {errors.username && (
              <span className="field-error">{errors.username}</span>
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
              className={errors.email ? "input-error" : ""}
              disabled={loading}
            />
            {errors.email && (
              <span className="field-error">{errors.email}</span>
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
              className={errors.password ? "input-error" : ""}
              disabled={loading}
            />
            {errors.password && (
              <span className="field-error">{errors.password}</span>
            )}
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
              className={errors.confirmPassword ? "input-error" : ""}
              disabled={loading}
            />
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
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
                className={errors.centerId ? "input-error" : ""}
                disabled={loading}
              />
              {errors.centerId && (
                <span className="field-error">{errors.centerId}</span>
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
