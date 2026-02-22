// ── Email ─────────────────────────────────────────────────────────────────────
// RFC 5321-compatible pragmatic regex: requires a local part, @ sign,
// a domain with at least one dot, and a TLD of 2+ chars.
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(email.trim()))
    return "Enter a valid email address (e.g. user@example.com).";
}

// ── Password rules ────────────────────────────────────────────────────────────
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (p: string) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "upper",
    label: "Uppercase letter (A–Z)",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "Lowercase letter (a–z)",
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    id: "digit",
    label: "Number (0–9)",
    test: (p: string) => /\d/.test(p),
  },
  {
    id: "special",
    label: "Special character (@$!%*?&)",
    test: (p: string) => /[@$!%*?&]/.test(p),
  },
] as const;

export type PasswordRuleId = (typeof PASSWORD_RULES)[number]["id"];

/**
 * Full password validator used on the registration form.
 * Returns an error string when any rule is violated, undefined when valid.
 */
export function validatePasswordStrict(password: string): string | undefined {
  if (!password) return "Password is required.";
  if (password.length < PASSWORD_MIN_LENGTH)
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  const failed = PASSWORD_RULES.filter((r) => !r.test(password));
  if (failed.length > 0)
    return "Password must include uppercase, lowercase, digit and special character (@$!%*?&).";
}

/**
 * Minimal password validator used on the login form.
 * Only enforces presence and minimum length (avoids leaking the exact policy
 * to an attacker testing credentials).
 */
export function validatePasswordLogin(password: string): string | undefined {
  if (!password) return "Password is required.";
  if (password.length < PASSWORD_MIN_LENGTH)
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
}

// ── Password strength ─────────────────────────────────────────────────────────
export interface PasswordStrength {
  /** 0 = empty, 1–5 = number of filled bars */
  score: 0 | 1 | 2 | 3 | 4 | 5;
  label: string;
  color: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", color: "transparent" };
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed <= 1) return { score: 1, label: "Too weak", color: "#ef4444" };
  if (passed === 2) return { score: 2, label: "Weak", color: "#f97316" };
  if (passed === 3) return { score: 3, label: "Fair", color: "#eab308" };
  if (passed === 4) return { score: 4, label: "Strong", color: "#22c55e" };
  return { score: 5, label: "Very strong", color: "#16a34a" };
}

// ── Username ──────────────────────────────────────────────────────────────────
export function validateUsername(username: string): string | undefined {
  if (!username.trim()) return "Username is required.";
  if (username.trim().length < 3)
    return "Username must be at least 3 characters.";
}
