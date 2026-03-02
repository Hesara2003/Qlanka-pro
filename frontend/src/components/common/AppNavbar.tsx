import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ── Nav link items per role ─────────────────────────────────────────────────
const CITIZEN_LINKS = [
  { to: "/dashboard",       label: "My Tokens" },
  { to: "/service-centers", label: "Service Centers" },
];

const ADMIN_LINKS = [
  { to: "/admin",                         label: "Dashboard" },
  { to: "/service-centers",              label: "Service Centers" },
  { to: "/admin/service-centers/create", label: "Create Center" },
  { to: "/admin/users",                  label: "Manage Users" },
];

const ROLE_BADGE: Record<string, string> = {
  admin:   "bg-purple-100 text-purple-700",
  officer: "bg-blue-100   text-blue-700",
  citizen: "bg-green-100  text-green-700",
};

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const links = isAdmin ? ADMIN_LINKS : CITIZEN_LINKS;
  const homeRoute = isAdmin ? "/admin" : "/dashboard";
  const badgeClass = ROLE_BADGE[user.role] ?? "bg-gray-100 text-gray-700";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function navLinkClass({ isActive }: { isActive: boolean }) {
    return [
      "text-sm font-medium px-3 py-1.5 rounded-md transition-colors",
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    ].join(" ");
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* ── Logo ── */}
          <Link
            to={homeRoute}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">QueueLanka</span>
          </Link>

          {/* ── Desktop nav links ── */}
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={navLinkClass} end={l.to === "/admin" || l.to === "/dashboard"}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* ── Right side: badge + logout ── */}
          <div className="hidden sm:flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${badgeClass}`}>
              {user.role}
            </span>
            <span className="text-sm text-gray-700 font-medium">{user.username}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
            >
              Sign out
            </button>
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="sm:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/admin" || l.to === "/dashboard"}
              className={({ isActive }) =>
                `block text-sm font-medium px-3 py-2 rounded-md ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`
              }
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${badgeClass}`}>
                {user.role}
              </span>
              <span className="text-sm text-gray-700">{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 font-medium hover:text-red-700"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
