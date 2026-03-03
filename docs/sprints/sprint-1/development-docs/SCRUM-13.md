# SCRUM-13  Authentication API Contract

## Summary

Defines the full API contract for the authentication endpoints in `QueueLanka.API`. Content is derived directly from reading `AuthController.cs`, `AuthService.cs`, and all DTOs under `DTOs/Auth/`.

---

## Base Route

`/api/auth`

---

## Endpoints

### 1. Register  `POST /api/auth/register`

**Purpose:** Create a new user account. Valid roles: `citizen`, `officer`, `admin`.

**Request body (`RegisterRequestDto`):**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `username` | string | Yes | 350 chars; regex `^[a-zA-Z0-9_]+$` |
| `password` | string | Yes | 8100 chars; must have uppercase, lowercase, digit, special char |
| `email` | string | Yes | Valid email; max 100 chars |
| `role` | string | Yes | One of `citizen`, `officer`, `admin` |
| `centerId` | int? | No | Required when `role` = `officer`; ignored otherwise |

**Example request:**
```json
{
  "username": "jdoe_01",
  "password": "Str0ng!Pass",
  "email": "j.doe@example.com",
  "role": "citizen"
}
```

**Success response (`201 Created`)  `RegisterResponseDto`:**
```json
{
  "userId": 123,
  "username": "jdoe_01",
  "role": "citizen"
}
```

**Error responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Missing or invalid fields (returned with `validationErrors` array) |
| 409 | `DUPLICATE_USERNAME` | Username already taken |
| 409 | `DUPLICATE_EMAIL` | Email already registered |
| 422 | `INVALID_ROLE` | Role is not `citizen`, `officer`, or `admin` |
| 422 | `CENTER_REQUIRED` | Role is `officer` but `centerId` was not supplied |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### 2. Login  `POST /api/auth/login`

**Purpose:** Authenticate and receive a JWT access token plus a refresh token.

**Request body (`LoginRequestDto`):**

| Field | Type | Required |
|-------|------|----------|
| `username` | string | Yes |
| `password` | string | Yes |

**Example request:**
```json
{
  "username": "jdoe_01",
  "password": "Str0ng!Pass"
}
```

**Success response (`200 OK`)  `LoginResponseDto`:**
```json
{
  "token": "<jwt-access-token>",
  "refreshToken": "<64-byte-base64-string>",
  "expiresIn": 3600,
  "role": "citizen"
}
```

> `expiresIn` is in **seconds** (`AccessTokenExpiryMinutes  60`). Default from `appsettings.json`: 60 minutes  3600 s.

**Error responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Missing fields |
| 401 | `INVALID_CREDENTIALS` | Username not found or password mismatch (generic  no hint which field) |
| 403 | `ACCOUNT_DISABLED` | User account is deactivated (`IsActive = false`) |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### 3. Verify Email  `GET /api/auth/verify-email?token=<token>`

**Purpose:** Verify a user's email address via a one-time token sent by email.

> **Note:** Email sending is currently **disabled** (commented out in `AuthService.RegisterAsync`). Users are auto-verified on registration (`IsEmailVerified` defaults to the database row value; the verification email call is skipped). This endpoint exists but will not be reached in normal flow during Sprint 1.

**Query parameter:** `token` (string, required)

**Success response (`200 OK`)  `VerifyEmailResponseDto`:**
```json
{ "message": "Email verified successfully." }
```

**Error responses:** 400 `INVALID_VERIFICATION_TOKEN`, 500 `INTERNAL_ERROR`.

---

## JWT Token Details

- **Algorithm:** HMAC-SHA256
- **Issuer:** `queuelanka-api`
- **Audience:** `queuelanka-client`
- **Clock skew:** `TimeSpan.Zero` (no tolerance on expiry)
- **Default expiry:** 60 minutes (`Jwt:AccessTokenExpiryMinutes` in `appsettings.json`)
- **Claims:**

| Claim | Value |
|-------|-------|
| `sub` | `userId` (int, as string) |
| `unique_name` | `username` |
| `role` | user role string |
| `jti` | random GUID per token |
| `centerId` | officer/admin center id (only present when user has a centerId) |

- **Usage:** `Authorization: Bearer <token>` header on all protected routes.
- **Missing/invalid token responses from middleware:**

| Condition | Code |
|-----------|------|
| No `Authorization` header | `TOKEN_MISSING` |
| Header present but token invalid/expired | `TOKEN_INVALID` |
| Valid token, insufficient role | `FORBIDDEN` |

---

## Refresh Token Details

- Generated with `RandomNumberGenerator.GetBytes(64)`  Base64-encoded string.
- Expiry configured via `Jwt:RefreshTokenExpiryDays` (default: 7 days).
- Client must store securely and send when requesting a new access token.

---

## Standard Error Response Format (`ErrorResponse`)

All error responses follow this envelope:

```json
{
  "success": false,
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid username or password.",
  "details": null,
  "validationErrors": null,
  "timestamp": "2026-03-01T12:05:00Z",
  "path": "/api/auth/login",
  "correlationId": "abc-123"
}
```

For validation errors (`400`), `validationErrors` is populated:
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more validation errors occurred.",
  "validationErrors": [
    { "field": "password", "message": "Password must contain uppercase...", "rejectedValue": "short" }
  ],
  "timestamp": "...",
  "path": "/api/auth/register",
  "correlationId": "..."
}
```

> In **Development** environment only: errors include a `details` object with `ExceptionType`, `StackTrace`, and `InnerException` for debugging.

---

## Implementation Notes (from code)

- Passwords hashed with `BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12)`.
- Password verification uses `BCrypt.Net.BCrypt.Verify`.
- Roles are validated case-insensitively in `AuthService`; invalid role throws `AppException` (422).
- Login returns `INVALID_CREDENTIALS` for both "user not found" and "wrong password"  intentionally generic to prevent user enumeration.
- Email verification flow exists but is disabled in Sprint 1; `IsEmailVerified` check in `LoginAsync` is also commented out.

---

## Security Notes

- **Production:** Replace `Jwt:Secret` placeholder with a secret manager / environment variable (min 32 chars, high entropy).
- Use HTTPS for all transport.
- Keep access token expiry short; rotate refresh tokens on use.
- Rate-limit login attempts to prevent brute-force.
- Never log raw passwords or JWT secrets.

---

*Document generated from source code: `AuthController.cs`, `AuthService.cs`, `DTOs/Auth/`.*
