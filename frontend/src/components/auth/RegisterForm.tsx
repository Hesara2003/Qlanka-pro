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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
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

  const inputBaseClass = "w-full px-4 py-3.5 bg-gray-100 border border-transparent rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
  const inputErrorClass = "border-red-500 bg-red-50";

  return (
    <div className="flex min-h-screen w-full font-sans text-gray-900 bg-white">
      {/* Image Section */}
      <div className="hidden lg:block lg:flex-[1.2] relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=2000&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-indigo-900/20 mix-blend-multiply" />
        <div className="absolute bottom-6 left-8 text-white text-sm opacity-90 drop-shadow-md font-medium">Sri Lanka</div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="m-auto w-full max-w-[440px] p-10 flex flex-col">

          {/* Logo Header */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">QueueLanka</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
          <p className="text-gray-500 text-sm mb-6">Join QueueLanka — skip the queue.</p>

          {apiError && <div className="px-4 py-3 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{apiError}</div>}
          {success && <div className="px-4 py-3 mb-6 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-xs font-semibold text-gray-800 mb-1.5">Username</label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. john_doe"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputBaseClass} ${touched.username && errors.username ? inputErrorClass : ""}`}
                  disabled={loading}
                  aria-describedby={touched.username && errors.username ? "username-error" : undefined}
                />
              </div>
              {touched.username && errors.username && (
                <span id="username-error" className="block text-xs text-red-500 mt-1.5" role="alert">{errors.username}</span>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-xs font-semibold text-gray-800 mb-1.5">Email</label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputBaseClass} ${touched.email && errors.email ? inputErrorClass : ""}`}
                  disabled={loading}
                  aria-describedby={touched.email && errors.email ? "email-error" : undefined}
                />
              </div>
              {touched.email && errors.email && (
                <span id="email-error" className="block text-xs text-red-500 mt-1.5" role="alert">{errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-xs font-semibold text-gray-800 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min 8 chars, upper, lower, digit, symbol"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputBaseClass} pr-10 ${touched.password && errors.password ? inputErrorClass : ""}`}
                  disabled={loading}
                  aria-describedby={touched.password && errors.password ? "password-error" : undefined}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer flex items-center justify-center p-1" onClick={() => setShowPassword(!showPassword)} title="Toggle password visibility">
                  {showPassword ? (
                    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" height="16" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.288m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" height="16" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </span>
              </div>
              {touched.password && errors.password && (
                <span id="password-error" className="block text-xs text-red-500 mt-1.5" role="alert">{errors.password}</span>
              )}
              {/* Live strength meter */}
              <PasswordStrengthMeter password={form.password} />
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-800 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputBaseClass} pr-10 ${touched.confirmPassword && errors.confirmPassword ? inputErrorClass : ""}`}
                  disabled={loading}
                  aria-describedby={touched.confirmPassword && errors.confirmPassword ? "confirmPassword-error" : undefined}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer flex items-center justify-center p-1" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title="Toggle password visibility">
                  {showConfirmPassword ? (
                    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" height="16" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.288m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" height="16" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </span>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <span id="confirmPassword-error" className="block text-xs text-red-500 mt-1.5" role="alert">{errors.confirmPassword}</span>
              )}
            </div>

            {/* Role */}
            <div className="mb-4">
              <label htmlFor="role" className="block text-xs font-semibold text-gray-800 mb-1.5">Role</label>
              <div className="relative">
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={inputBaseClass}
                >
                  <option value="citizen">Citizen</option>
                  <option value="officer">Service Centre Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <span className="block text-xs text-gray-400 mt-1.5">
                Select the role that best describes you.
              </span>
            </div>

            {/* Centre ID — only for officers */}
            {form.role === "officer" && (
              <div className="mb-4">
                <label htmlFor="centerId" className="block text-xs font-semibold text-gray-800 mb-1.5">Centre ID</label>
                <div className="relative">
                  <input
                    id="centerId"
                    name="centerId"
                    type="number"
                    placeholder="Your service centre ID"
                    value={form.centerId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputBaseClass} ${touched.centerId && errors.centerId ? inputErrorClass : ""}`}
                    disabled={loading}
                    aria-describedby={touched.centerId && errors.centerId ? "centerId-error" : undefined}
                  />
                </div>
                {touched.centerId && errors.centerId && (
                  <span id="centerId-error" className="block text-xs text-red-500 mt-1.5" role="alert">{errors.centerId}</span>
                )}
              </div>
            )}

            <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-lg text-sm font-semibold mb-6 mt-4 transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
              {loading ? "Creating account…" : "Register"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 m-0">
            Already have an account? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>

          <div className="flex items-center justify-between mt-10 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
              <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">Q</div>
              <span>@queuelanka</span>
            </div>
            <div className="text-xs text-gray-400">
              © QueueLanka Pro 2026
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
