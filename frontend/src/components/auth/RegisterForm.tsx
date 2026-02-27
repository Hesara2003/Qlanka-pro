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

  return (
    <div
      className="h-screen flex items-center justify-center p-4 sm:p-6 font-sans text-gray-900 overflow-hidden bg-cover bg-center relative"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=2000&auto=format&fit=crop')" }}
    >
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
      <div className="relative z-10 flex w-full max-w-[750px] bg-white rounded-2xl shadow-2xl overflow-hidden h-fit max-h-[100vh]">
        {/* Form Container */}
        <div className="w-full px-8 py-6 sm:px-12 flex flex-col justify-start">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-4 mt-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#142646] tracking-tight">QueueLanka</span>
          </div>

          <h1 className="text-[24px] font-bold text-[#142646] mb-1">Create an account</h1>
          <p className="text-gray-500 text-[13px] mb-4">Join the platform! Select method to sign up:</p>

          {apiError && <div className="px-4 py-2 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{apiError}</div>}
          {success && <div className="px-4 py-2 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

          {/* Social Auth Buttons */}
          <div className="flex gap-4 mb-5">
            <button type="button" className="flex-1 py-2.5 px-4 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.05-3.71 1.05-2.85 0-5.27-1.93-6.13-4.52H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.87 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.69-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.69 2.84c.86-2.59 3.28-4.5 6.13-4.5z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button type="button" className="flex-1 py-2.5 px-4 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
              </svg>
              Facebook
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-4">
            <span className="absolute inset-x-0 h-px bg-gray-200"></span>
            <span className="relative bg-white px-3 text-[12px] text-gray-400 font-medium tracking-wide">or register with email</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Username */}
            <div className="mb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-2 bg-[#F9FAFB] border ${touched.username && errors.username ? "border-red-400" : "border-gray-200"} rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600`}
                  disabled={loading}
                />
              </div>
              {touched.username && errors.username && (
                <span className="block text-xs text-red-500 mt-1.5" role="alert">{errors.username}</span>
              )}
            </div>

            {/* Email */}
            <div className="mb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><polyline points="3 7 12 13 21 7"></polyline>
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-2 bg-[#F9FAFB] border ${touched.email && errors.email ? "border-red-400" : "border-gray-200"} rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600`}
                  disabled={loading}
                />
              </div>
              {touched.email && errors.email && (
                <span className="block text-xs text-red-500 mt-1" role="alert">{errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="mb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-10 py-2 bg-[#F9FAFB] border ${touched.password && errors.password ? "border-red-400" : "border-gray-200"} rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <span className="block text-xs text-red-500 mt-1" role="alert">{errors.password}</span>
              )}
              {/* Live strength meter */}
              <div className="mt-1">
                <PasswordStrengthMeter password={form.password} />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-10 py-2 bg-[#F9FAFB] border ${touched.confirmPassword && errors.confirmPassword ? "border-red-400" : "border-gray-200"} rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <span className="block text-xs text-red-500 mt-1" role="alert">{errors.confirmPassword}</span>
              )}
            </div>

            {/* Role */}
            <div className="mb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 appearance-none`}
                >
                  <option value="citizen">Citizen</option>
                  <option value="officer">Service Centre Officer</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>

            {/* Center ID */}
            {form.role === "officer" && (
              <div className="mb-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <input
                    id="centerId"
                    name="centerId"
                    type="number"
                    placeholder="Centre ID"
                    value={form.centerId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-2 bg-[#F9FAFB] border ${touched.centerId && errors.centerId ? "border-red-400" : "border-gray-200"} rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600`}
                    disabled={loading}
                  />
                </div>
                {touched.centerId && errors.centerId && (
                  <span className="block text-xs text-red-500 mt-1" role="alert">{errors.centerId}</span>
                )}
              </div>
            )}

            <button type="submit" className="w-full py-2.5 bg-[#0C5AFA] text-white rounded-lg text-sm font-semibold mb-3 mt-3 transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed shadow-md" disabled={loading}>
              {loading ? "Creating account…" : "Register"}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 m-0 pb-2">
            Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
