# Sprint 4 OWASP Top 10 Checklist (Local Assessment)

| OWASP Area | Checked Items | Evidence | Finding | Severity | Mitigation |
|---|---|---|---|---|---|
| Broken Authentication | JWT required on protected routes, invalid/expired/tampered token handling | `CounterAuthorizationTests`, `ReportsAuthorizationTests` | Auth enforcement works (401/403) | Low | Keep token expiry short, rotate signing secrets, add refresh token revocation tests |
| Broken Access Control | Role restrictions for admin/officer endpoints | `CounterAuthorizationTests`, `ReportsAuthorizationTests` | Role boundaries enforced | Low | Add periodic negative tests for every new endpoint in PR checklist |
| Injection | SQL query parameterization in report repository | `backend/QueueLanka.Queue/Data/ReportRepository.cs` | Query uses parameter placeholders for date/center inputs | Low | Keep dynamic SQL strictly parameterized and add static analyzer gate |
| Sensitive Data Exposure | Error payload review + log output review | `ReportsAuthorizationTests` (safe messages), middleware responses | No stack traces leaked in API responses | Low | Maintain generic external errors and log internals server-side only |
| Security Misconfiguration | HTTP security headers + CORS defaults | `SecurityHeadersMiddleware`, service `Program.cs` | Security headers now present; separate API project still uses permissive CORS for local dev | Medium | Restrict CORS origins per env; fail startup if wildcard origin is used outside development |
| Vulnerable Components | Dependency vulnerability signal | local `dotnet test` warning `NU1902` (MailKit 4.7.1.1) | Moderate package advisory present | Medium | Upgrade MailKit to patched version and re-run dependency scan |

## Notes
- This is a local code-and-test-based OWASP pass, not a network pentest.
- Priority action: remediate vulnerable component warning and tighten non-dev CORS policy checks.
