import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import type { AuthUser } from "../../types/auth";
import { validatePasswordLogin } from "../../utils/validation";

interface FormState {
  username: string;
  password: string;
}

type FormField = keyof FormState;

interface FormErrors {
  username?: string;
  password?: string;
}

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!values.username.trim()) errors.username = "Username is required.";
  const passwordErr = validatePasswordLogin(values.password);
  if (passwordErr) errors.password = passwordErr;
  return errors;
}

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // If ProtectedRoute redirected here, honour the original destination
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  const [form, setForm] = useState<FormState>({ username: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    setTouched({ username: true, password: true });

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const result = await loginUser({
        username: form.username.trim(),
        password: form.password,
      });

      const authUser: AuthUser = {
        username: form.username.trim(),
        role: result.role,
        token: result.token,
      };

      login(authUser);
      // Admins always land on the admin dashboard.
      // Citizens are sent back to their original destination (if any), otherwise the dashboard.
      const destination = authUser.role === "admin"
        ? "/admin"
        : (from ?? "/dashboard");
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="h-screen flex items-center justify-center p-4 sm:p-6 font-sans text-gray-900 overflow-hidden bg-cover bg-center relative"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=2000&q=80')" }}
    >
      <div className="absolute inset-0 bg-[#1a1c23]/80 backdrop-blur-sm" />
      <div className="relative z-10 flex w-full max-w-[1000px] bg-white rounded-[2rem] shadow-2xl overflow-hidden h-[600px] max-h-screen">
        {/* Left Side: Form */}
        <div className="w-full lg:w-[50%] p-8 sm:p-12 flex flex-col justify-center overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 w-max">
            <div className="w-8 h-8 rounded-full bg-[#78d64b] flex items-center justify-center shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 2L2 22h20L12 2z" fill="white" stroke="none" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#1a1c23] tracking-tight">QueueLanka</span>
          </Link>

          <h1 className="text-3xl font-bold text-[#1a1c23] mb-2 tracking-tight">Log in to your Account</h1>
          <p className="text-gray-500 text-sm mb-6">Welcome back! Select method to log in:</p>

          {apiError && <div className="px-4 py-3 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">{apiError}</div>}

          {/* Social Auth Buttons */}
          <div className="flex gap-4 mb-6">
            <button type="button" className="flex-1 py-3 px-4 bg-white border border-gray-200 rounded-full text-sm font-bold text-[#1a1c23] flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-colors shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.05-3.71 1.05-2.85 0-5.27-1.93-6.13-4.52H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.87 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.69-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.69 2.84c.86-2.59 3.28-4.5 6.13-4.5z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button type="button" className="flex-1 py-3 px-4 bg-white border border-gray-200 rounded-full text-sm font-bold text-[#1a1c23] flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-colors shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
              </svg>
              Facebook
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <span className="absolute inset-x-0 h-px bg-gray-200"></span>
            <span className="relative bg-white px-3 text-xs text-gray-400 font-semibold tracking-wider uppercase">or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Username/Email */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><polyline points="3 7 12 13 21 7"></polyline>
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Email or Username"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border ${touched.username && errors.username ? "border-red-400" : "border-gray-200"} rounded-xl text-sm outline-none transition-all duration-200 focus:bg-white focus:border-[#78d64b] focus:ring-1 focus:ring-[#78d64b] text-[#1a1c23] font-medium`}
                  disabled={loading}
                />
              </div>
              {touched.username && errors.username && (
                <span className="block text-xs text-red-500 mt-1.5 font-medium" role="alert">{errors.username}</span>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-11 pr-11 py-3.5 bg-gray-50 border ${touched.password && errors.password ? "border-red-400" : "border-gray-200"} rounded-xl text-sm outline-none transition-all duration-200 focus:bg-white focus:border-[#78d64b] focus:ring-1 focus:ring-[#78d64b] text-[#1a1c23] font-medium`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#1a1c23] transition-colors"
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
                <span className="block text-xs text-red-500 mt-1.5 font-medium" role="alert">{errors.password}</span>
              )}
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between mb-8">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 text-[#0a5c4e] bg-gray-100 border-gray-300 rounded focus:ring-[#78d64b] cursor-pointer" />
                <span className="text-[13px] font-semibold text-gray-500 group-hover:text-[#1a1c23] transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-[13px] font-bold text-[#0a5c4e] hover:text-[#78d64b] transition-colors" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
            </div>

            <button type="submit" className="w-full py-4 bg-[#1a1c23] text-white rounded-full text-sm font-bold mb-6 transition-all hover:bg-black active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 font-medium">
            Don't have an account? <Link to="/register" className="text-[#0a5c4e] font-bold hover:underline hover:text-[#78d64b]">Create an account</Link>
          </p>
        </div>

        {/* Right Side: Visual Section */}
        <div className="hidden lg:flex w-[50%] bg-[#0a5c4e] relative overflow-hidden flex-col items-center justify-center p-12 text-center text-white">
          <img src="https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=800&q=80" alt="Team meeting" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[#0a5c4e]/60" />

          {/* Foreground Content */}
          <div className="relative z-10 w-full max-w-[380px] bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[2rem] shadow-xl">
            {/* Abstract Decorative Element */}
            <div className="w-20 h-20 mx-auto bg-[#78d64b] rounded-2xl flex items-center justify-center text-[#074b42] shadow-lg mb-8 transform -rotate-6">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            
            <h2 className="text-3xl font-bold mb-4 tracking-tight text-white leading-tight">
                Streamline Your <br/> <span className="text-[#78d64b]">Queue Process</span>
            </h2>
            <p className="text-[15px] text-[#a0ccbc] leading-relaxed font-medium mb-8">
                Log in to monitor live analytics, manage your counters, and reduce customer wait times by up to 98%.
            </p>
            
            <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-1 bg-[#78d64b] rounded-full"></div>
                <div className="w-3 h-1 bg-white/30 rounded-full"></div>
                <div className="w-3 h-1 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
