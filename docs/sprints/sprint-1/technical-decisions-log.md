# Technical Decisions Log  Sprint 1

**Sprint:** Sprint 1 (February 19  March 4, 2026)
**Project:** QueueLanka Pro  SE3022 Case Study
**Document Owner:** Developer / DevOps
**Last Updated:** March 4, 2026

This document records all significant technical decisions made during Sprint 1, including the rationale, alternatives considered, and impact on the codebase.

---

## 1. Database Schema Changes

### 1.1 Core Tables Introduced

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | All system users | `user_id`, `username`, `email`, `password_hash`, `role`, `center_id`, `is_active`, `is_email_verified`, `deleted_at`, `deleted_by`, `last_login_at` |
| `service_centers` | Queue service locations | `center_id`, `name`, `address`, `timezone`, `capacity`, `average_service_time_minutes`, `opening_time`, `closing_time`, `is_active` |
| `center_locations` | Structured geo-data for centers | `location_id`, `center_id`, `street_address`, `city`, `district`, `province`, `latitude`, `longitude`, `google_maps_url`, `landmark` |
| `center_operating_days` | Default weekly schedule per center | `operating_day_id`, `center_id`, `day_of_week`, `is_open`, `opening_time`, `closing_time` |
| `center_availability` | Per-date availability overrides | `availability_id`, `center_id`, `date`, `is_available`, `opening_time`, `closing_time`, `reason` |
| `appointments` | Booked time slots | `appointment_id`, `center_id`, `user_id`, `appointment_date`, `appointment_time`, `status` |
| `tokens` | Queue tokens issued on booking | `token_id`, `center_id`, `user_id`, `appointment_id`, `token_number`, `issued_date`, `status`, `issued_time`, `estimated_service_time`, `served_time`, `completed_time`, `cancelled_at` |
| `email_verification_tokens` | One-time email verify tokens | `token_id`, `user_id`, `token`, `expires_at`, `used_at` |
| `user_audit_log` | Immutable admin action log | `audit_id`, `target_user_id`, `performed_by`, `action`, `note`, `performed_at` |

### 1.2 Key Schema Design Decisions

**Soft-delete on `users`:**
- Decision: Use `deleted_at` / `deleted_by` columns instead of a boolean `is_deleted` flag.
- Rationale: Preserves full audit trail; `IsDeleted` is computed as `DeletedAt.HasValue` in the model so consumers never need raw null checks.
- Alternative considered: Hard delete  rejected because audit logging requires knowing who was deleted.

**Scheduled time stored as `TIME` (TimeSpan) not `DATETIME`:**
- Decision: `appointment_time` in `appointments` and `opening_time`/`closing_time` in `service_centers` are stored as `TIME` columns mapped to C# `TimeSpan`.
- Rationale: Service center hours are time-of-day values, not absolute instants; decoupling from date avoids timezone conversion bugs.

**`center_availability` override table:**
- Decision: A separate per-date override table rather than a CRON-based flag on the center.
- Rationale: Allows admins to mark specific dates (public holidays, special events) with custom hours or closure reasons without affecting the default schedule.

**`center_operating_days` seeded on center creation:**
- Decision: When a new service center is created via `POST /api/service-centers`, default MondayFriday open / SaturdaySunday closed rows are inserted atomically.
- Rationale: Every center must have a schedule; requiring admins to create it separately introduces a common mistake.

**Token number format: `TKN-{centerId}-{yyMMdd}-{randomHex4}`:**
- Decision: Generated in `AppointmentService.BookTokenAsync` at booking time.
- Rationale: Embeds enough context (center, date, uniqueness) to be readable on a printed slip.

### 1.3 Atomic Stored Procedures

Two stored procedures handle critical concurrent operations:

| Procedure | Purpose |
|-----------|---------|
| `BookAtomicAsync` | Validates, books an appointment, and issues a token atomically. Returns result codes: `CENTER_NOT_FOUND`, `DUPLICATE_BOOKING`, `TIME_CONFLICT`, `CENTER_FULL`, `SUCCESS`. |
| `CancelAndShiftQueueAsync` | Cancels a `Waiting` token and renumbers the queue positions of downstream waiting tokens atomically. |

**Decision rationale:** Application-level locking (e.g., `mutex`, `SemaphoreSlim`) would break under horizontal scaling. Database-level atomic operations via stored procedures guarantee consistency without distributed locking overhead.

---

## 2. API Changes

### 2.1 Standardized Response Envelope (SCRUM-29)

**Decision:** All successful responses use `ApiResponse<T>`, all errors use `ErrorResponse`.

**`ApiResponse<T>` structure:**
```json
{
  "success": true,
  "data": { ... },
  "metadata": { "timestamp": "...", "totalCount": null, "correlationId": "..." },
  "message": null
}
```

**`ErrorResponse` structure:**
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human-readable message.",
  "details": null,
  "validationErrors": null,
  "timestamp": "...",
  "path": "/api/...",
  "correlationId": "..."
}
```

**Rationale:** Consistent response shapes let the frontend use a single API client interceptor for error handling and success data extraction.

**Known inconsistency:** `GET /api/token/my-tokens` currently returns a raw array (not wrapped). Identified at end of sprint  to be fixed in Sprint 2 (BUG-01).

### 2.2 Machine-Readable Error Codes

**Decision:** Every error carries a `code` string (e.g., `DUPLICATE_BOOKING`, `INVALID_CREDENTIALS`) in addition to an HTTP status code.

**Rationale:** HTTP status codes alone are insufficient when multiple distinct error conditions map to the same status (e.g., 409 is used for `DUPLICATE_BOOKING`, `DUPLICATE_USERNAME`, and `CENTER_FULL`). Frontend can display localised messages by switching on `code`.

**Full error code registry (Sprint 1):**

| Code | HTTP | Source |
|------|------|--------|
| `DUPLICATE_USERNAME` | 409 | Register |
| `DUPLICATE_EMAIL` | 409 | Register |
| `INVALID_ROLE` | 422 | Register |
| `CENTER_REQUIRED` | 422 | Register |
| `INVALID_CREDENTIALS` | 401 | Login |
| `ACCOUNT_DISABLED` | 403 | Login |
| `INVALID_VERIFICATION_TOKEN` | 400 | Email verify |
| `SERVICE_CENTER_NOT_FOUND` | 404 | Service centers |
| `SERVICE_CENTER_UNAVAILABLE` | 503 | Booking |
| `INVALID_SERVICE_CENTER_DATA` | 400 | Service centers |
| `DUPLICATE_SERVICE_CENTER` | 409 | Admin create center |
| `LOCATION_NOT_FOUND` | 404 | Location endpoint |
| `DATA_ACCESS_ERROR` | 500 | Repository layer |
| `DUPLICATE_BOOKING` | 409 | Booking |
| `CENTER_FULL` | 409 | Booking |
| `USER_NOT_FOUND` | 404 | Admin users |
| `CANNOT_DELETE_ADMIN` | 403 | Admin users |
| `INVALID_USER_ID` | 400 | Admin users |
| `INVALID_ROLE_FILTER` | 400 | Admin users |
| `TOKEN_MISSING` | 401 | JWT middleware |
| `TOKEN_INVALID` | 401 | JWT middleware |
| `FORBIDDEN` | 403 | JWT middleware |
| `INTERNAL_ERROR` | 500 | Global handler |
| `VALIDATION_ERROR` | 400 | Model validation |

### 2.3 Validation Filter (Global)

**Decision:** `ValidationFilter` applied globally via `builder.Services.AddControllers(o => o.Filters.Add<ValidationFilter>())`.

**Rationale:** Automatic model validation produces `ErrorResponse` with `validationErrors` array before the controller action runs; avoids repetitive null/validation checks in every controller method.

### 2.4 REST Naming Convention

**Decision:** Endpoints use `kebab-case` path segments where multi-word (e.g., `/api/service-centers/{id}/availability`).

**Decision:** Admin endpoints are namespaced under `/api/admin/` (e.g., `/api/admin/users`) to make role boundary explicit.

---

## 3. Security Decisions

### 3.1 Password Hashing  BCrypt Work Factor 12

**Decision:** `BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12)`.

**Rationale:**
- Work factor 12 produces a hash in ~300 ms on modern hardware  expensive enough to deter brute-force but acceptable for login latency.
- Adaptive: can be increased in future sprints without rehashing existing passwords (password re-hash on next login pattern).
- Alternative considered: `Argon2id`  chosen not to introduce an extra dependency in Sprint 1; planned revisit in Sprint 3.

### 3.2 JWT  HMAC-SHA256, ClockSkew Zero

**Decision:** JWT signed with HMAC-SHA256. `ClockSkew = TimeSpan.Zero`.

**Token claims:**

| Claim | Value |
|-------|-------|
| `sub` | `userId` |
| `unique_name` | `username` |
| `role` | user role |
| `jti` | unique GUID per token |
| `centerId` | officer/admin center (optional) |

**Clock skew = zero rationale:** Prevent tokens from remaining valid past their stated expiry. Without this, the default 5-minute tolerance allows replay attacks in the window between expiry and invalidation.

**Configuration:** JSON keys  `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience`, `Jwt:AccessTokenExpiryMinutes` (default 60), `Jwt:RefreshTokenExpiryDays` (default 7).

**Production note:** `Jwt:Secret` must be replaced with a value from a secret store (Azure Key Vault / environment variable). Never committed to source control.

### 3.3 Custom Auth Error Responses

**Decision:** Custom `JwtBearerEvents` in `Program.cs` return JSON (`TOKEN_MISSING` / `TOKEN_INVALID` / `FORBIDDEN`) instead of ASP.NET's default HTML 401/403 pages.

**Rationale:** Frontend clients expect JSON; HTML error pages would break the API contract for SPA consumers.

### 3.4 Soft Delete + Audit Log

**Decision:** User deletion is soft-delete only (`deleted_at`, `deleted_by` columns set; `users.is_active` = false). An immutable row is written to `user_audit_log`.

**Rationale:** Hard delete is irreversible and loses audit trail. Soft delete satisfies GDPR right-to-erasure via scheduled anonymization without data loss for forensic purposes. `CannotDeleteAdminException` prevents accidental removal of admin accounts.

### 3.5 Generic Login Error

**Decision:** `POST /api/auth/login` returns `INVALID_CREDENTIALS` for both "username not found" and "wrong password"  same message for both.

**Rationale:** Distinct messages ("user not found" vs "wrong password") enable username enumeration attacks.

### 3.6 Email Verification  Deferred

**Decision:** The email verification send (`IEmailVerificationService.SendVerificationEmail`) was commented out in `AuthService.RegisterAsync` for Sprint 1. Users are auto-verified.

**Rationale:** SMTP configuration was not finalized; blocking registration on email delivery would prevent end-to-end demo. The token generation and verification endpoint (`GET /api/auth/verify-email`) are complete and tested; only the send step is deferred.

---

## 4. Caching Decisions

### 4.1 Redis  Available, Not Activated

**Decision:** `redis:7-alpine` is included in `docker-compose.yml` and the `ConnectionStrings` config allows a `Redis__ConnectionString` key. However, no caching layer was implemented in Sprint 1.

**Rationale:** Sprint 1 scope focused on correctness and completeness of core features. Premature caching adds complexity without measurable benefit until real load testing occurs.

### 4.2 Planned Cache Targets (Sprint 2+)

| Resource | Strategy | TTL |
|----------|----------|-----|
| Service center list | Read-through cache, invalidate on admin write | 5 min |
| Center availability | Short TTL, invalidate on `CenterAvailability` write | 1 min |
| JWT revocation list | Redis set, keyed by `jti` | Token lifetime |

### 4.3 No In-Memory Caching in Sprint 1

**Decision:** `IMemoryCache` was not registered or used.

**Rationale:** Avoids cache inconsistency issues in a multi-instance deployment (which is planned). Redis is the correct distributed cache and will be activated in Sprint 2.

---

## 5. Architecture Modifications

### 5.1 Repository Pattern with Dapper (not Entity Framework)

**Decision:** All data access uses the Repository pattern (`IUserRepository`, `IServiceCenterRepository`, etc.) implemented with **Dapper** (micro-ORM) rather than Entity Framework Core.

**Rationale:**
- Full control over SQL queries; important for complex booking and queue-shift logic.
- Dapper's thin abstraction means stored procedures integrate cleanly without ORM impedance mismatch.
- Easier to review and audit the exact SQL being executed.
- Alternative: EF Core with raw SQL for complex queries  rejected due to dual complexity (ORM + raw SQL hybrid).

### 5.2 Middleware Pipeline Order

**Defined order in `Program.cs`:**
1. `ExceptionMiddleware` (global error handler  must be first to catch all)
2. Swagger / HTTPS redirect (environment-conditional)
3. CORS (`AllowFrontend` policy)
4. `UseAuthentication()`
5. `UseAuthorization()`
6. `MapControllers()`

**Decision rationale:** ExceptionMiddleware must be outermost to catch exceptions from authentication/authorization middleware. CORS before auth ensures preflight OPTIONS requests respond without authentication overhead.

### 5.3 Global Exception Handling

**Decision:** `ExceptionMiddleware` catches all exceptions:
- `AppException` subclasses  mapped HTTP status + `code`
- All others  500 `INTERNAL_ERROR`
- Development env only  `details` block with `ExceptionType`, `StackTrace`, `InnerException`

**Rationale:** Prevents internal exception details from leaking to clients in production while keeping them available in development.

### 5.4 Scoped Dependency Injection

**Decision:** All repositories and services registered as `Scoped` (per-HTTP-request lifetime).

**Rationale:** Scoped matches the unit-of-work per request pattern. Singleton would cause connection sharing issues with Dapper's `IDbConnection`. Transient is unnecessarily wasteful.

### 5.5 Fire-and-Forget Notifications

**Decision:** `INotificationService.SendBookingConfirmationAsync` is invoked inside `AppointmentService.BookTokenAsync` without `await` (fire-and-forget).

**Rationale:** Notification delivery must not block or fail a successful booking. If the notification service is unavailable, the booking still succeeds. This is an intentional trade-off; a proper outbox/queue pattern is planned for Sprint 3.

### 5.6 Frontend: React + Vite + TypeScript

**Decision:** Frontend built with React 18, Vite, and TypeScript.

**Rationale:** Vite significantly faster HMR vs Create React App; TypeScript catches API contract mismatches at compile time.

### 5.7 Localization via i18n (Sprint 1 Scope)

**Decision:** `i18n` library integrated with Sinhala (`si`) and Tamil (`ta`) locale files. Components use `useTranslation` hook.

**Rationale:** Sri Lankan public service context requires Sinhala and Tamil. Implemented early to avoid large retrofitting cost in later sprints.

---

*Document generated from reading: `Program.cs`, `AuthService.cs`, `AppointmentService.cs`, `TokenService.cs`, `UserManagementService.cs`, `ExceptionMiddleware.cs`, all Models, all Exceptions, `appsettings.json`, and docker-compose configuration.*
