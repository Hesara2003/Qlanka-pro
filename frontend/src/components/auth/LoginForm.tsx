import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const { login } = useAuth();

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
      navigate("/dashboard");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

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
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">QueueLanka</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Nice to see you again</h1>

          {apiError && <div className="px-4 py-3 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{apiError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="mb-6">
              <label htmlFor="username" className="block text-xs font-semibold text-gray-800 mb-2">Login</label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Email or phone number"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3.5 bg-gray-100 border border-transparent rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${touched.username && errors.username ? "border-red-500 bg-red-50" : ""}`}
                  disabled={loading}
                  aria-describedby={touched.username && errors.username ? "username-error" : undefined}
                />
              </div>
              {touched.username && errors.username && (
                <span id="username-error" className="block text-xs text-red-500 mt-1.5" role="alert">{errors.username}</span>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-xs font-semibold text-gray-800 mb-2">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3.5 bg-gray-100 border border-transparent rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 pr-10 ${touched.password && errors.password ? "border-red-500 bg-red-50" : ""}`}
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
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between mb-8">
              <label className="flex items-center gap-2.5 cursor-pointer relative group">
                <input type="checkbox" className="peer sr-only" />
                <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-indigo-600 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-sm"></div>
                <span className="text-sm font-medium text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-indigo-600 hover:underline" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>

            <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold mb-4 transition-colors hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <button type="button" className="w-full py-3.5 bg-[#333333] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2.5 mb-8 hover:bg-[#1a1a1a] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.05-3.71 1.05-2.85 0-5.27-1.93-6.13-4.52H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.87 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.69-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.69 2.84c.86-2.59 3.28-4.5 6.13-4.5z" fill="#EA4335" />
              </svg>
              Or sign in with Google
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 m-0">
            Dont have an account? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Sign up now</Link>
          </p>

          <div className="flex items-center justify-between mt-12 mb-4">
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
