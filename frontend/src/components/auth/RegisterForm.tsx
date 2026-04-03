import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";
import type { RegisterRequest } from "../../types/auth";
import {
  validateEmail,
  validateUsername,
  validatePasswordStrict,
} from "../../utils/validation";
import registerHero from "../../assets/auth/register_hero.png";

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
    } else if (Number(values.centerId) <= 0) {
      errors.centerId = "Centre ID must be greater than 0.";
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
    <div className="w-full h-screen font-sans text-[#1a1c23] bg-white overflow-hidden select-none">
      <div className="flex w-full h-full lg:flex-row flex-col">
        
        {/* Left Side: Form Container */}
        <div className="w-full lg:w-[48%] h-full flex flex-col items-center justify-center bg-white px-8 sm:px-12 xl:px-24">
          <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Top Brand Accent */}
            <div className="w-12 h-1.5 bg-[#78d64b] rounded-full mb-8 opacity-80"></div>

            <h1 className="text-[48px] lg:text-[56px] font-medium text-[#1a1c23] mb-3 tracking-[-0.05em] leading-[0.95]">
              Create <br />
              Account
            </h1>
            <p className="text-[#94a3b8] text-[15px] font-normal mb-10 leading-relaxed max-w-[340px]">
              Start your journey today and streamline your operations.
            </p>

            {apiError && (
              <div className="px-6 py-4 mb-8 bg-red-50/50 border border-red-100 text-red-600 rounded-3xl text-[13px] font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {apiError}
              </div>
            )}
            
            {success && (
              <div className="px-6 py-4 mb-8 bg-[#78d64b]/10 border border-[#78d64b]/20 text-[#074b42] rounded-3xl text-[13px] font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 group">
                  <label htmlFor="username" className="text-[11px] font-medium text-[#94a3b8] ml-1 uppercase tracking-[0.2em]">Username</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Your username"
                    value={form.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-6 py-3.5 bg-gray-50/50 border ${touched.username && errors.username ? "border-red-200" : "border-transparent"} rounded-[18px] text-[14px] font-normal outline-none transition-all duration-300 focus:bg-white focus:border-[#78d64b] focus:ring-4 focus:ring-[#78d64b]/5 text-[#1a1c23] placeholder:text-[#cbd5e1]`}
                    disabled={loading}
                  />
                  {touched.username && errors.username && (
                    <span className="block text-[10px] text-red-500 mt-1 ml-1 font-normal animate-in fade-in" role="alert">{errors.username}</span>
                  )}
                </div>

                <div className="space-y-1 group">
                  <label htmlFor="email" className="text-[11px] font-medium text-[#94a3b8] ml-1 uppercase tracking-[0.2em]">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-6 py-3.5 bg-gray-50/50 border ${touched.email && errors.email ? "border-red-200" : "border-transparent"} rounded-[18px] text-[14px] font-normal outline-none transition-all duration-300 focus:bg-white focus:border-[#78d64b] focus:ring-4 focus:ring-[#78d64b]/5 text-[#1a1c23] placeholder:text-[#cbd5e1]`}
                    disabled={loading}
                  />
                  {touched.email && errors.email && (
                    <span className="block text-[10px] text-red-500 mt-1 ml-1 font-normal animate-in fade-in" role="alert">{errors.email}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1 group">
                <label htmlFor="password" className="text-[11px] font-medium text-[#94a3b8] ml-1 uppercase tracking-[0.2em]">Security Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-6 py-3.5 pr-14 bg-gray-50/50 border ${touched.password && errors.password ? "border-red-200" : "border-transparent"} rounded-[18px] text-[14px] font-normal outline-none transition-all duration-300 focus:bg-white focus:border-[#78d64b] focus:ring-4 focus:ring-[#78d64b]/5 text-[#1a1c23] placeholder:text-[#cbd5e1]`}
                    disabled={loading}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#cbd5e1] hover:text-[#1a1c23] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                {touched.password && errors.password && (
                  <span className="block text-[10px] text-red-500 mt-1 ml-1 font-normal animate-in fade-in" role="alert">{errors.password}</span>
                )}
              </div>

              <div className="space-y-1 group">
                <label htmlFor="role" className="text-[11px] font-medium text-[#94a3b8] ml-1 uppercase tracking-[0.2em]">Account Type</label>
                <div className="relative">
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    className={`w-full px-6 py-3.5 bg-gray-50/50 border border-transparent rounded-[18px] text-[14px] font-normal outline-none transition-all duration-300 focus:bg-white focus:border-[#78d64b] focus:ring-4 focus:ring-[#78d64b]/5 appearance-none text-[#1a1c23]`}
                  >
                    <option value="citizen">Citizen Account</option>
                    <option value="officer">Service Centre Officer</option>
                    <option value="admin">System Administrator</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none text-[#cbd5e1]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-[#78d64b] text-[#074b42] rounded-[18px] text-[15px] font-medium mt-3 shadow-premium transition-all duration-300 hover:bg-[#6bd041] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50" 
                disabled={loading}
              >
                {loading ? "Creating account…" : "Join QueueLanka"}
              </button>
            </form>

            <p className="text-center text-[13px] font-normal text-[#94a3b8] mt-8 tracking-tight">
              Already have an account? <Link to="/login" className="text-[#1a1c23] font-medium hover:text-[#78d64b] transition-colors">Log in now</Link>
            </p>
          </div>
        </div>

        {/* Right Side: Visual Section */}
        <div className="hidden lg:flex flex-1 relative items-end p-20 xl:p-28 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src={registerHero} 
              alt="Queue Management Efficiency" 
              className="w-full h-full object-cover"
            />
            {/* Subtle Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c23]/90 via-[#1a1c23]/40 to-transparent"></div>
          </div>

          <div className="relative z-10 max-w-[520px] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="mb-6 flex items-center gap-3">
              <span className="px-3 py-1 bg-[#78d64b]/20 border border-[#78d64b]/30 rounded-full text-[11px] font-bold text-[#78d64b] uppercase tracking-widest">
                Efficiency Redefined
              </span>
            </div>
            <h2 className="text-[36px] lg:text-[44px] font-medium text-white leading-[1.1] mb-8 tracking-tighter">
              Join 2,100+ branches transforming their customer experience.
            </h2>
            <p className="text-[15px] font-medium text-gray-400 uppercase tracking-[0.3em]">
              — QueueLanka Operations
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
