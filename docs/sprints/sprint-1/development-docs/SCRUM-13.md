**SCRUM-13 — Auth API contract**

**Summary**
This document defines the API contract for the authentication endpoints implemented under `POST /api/auth/register` and `POST /api/auth/login`. It includes request/response shapes, example payloads, error handling rules, and security recommendations consistent with the current backend implementation.

**Scope**
- Endpoints: `POST /api/auth/register`, `POST /api/auth/login` (base route: `/api/auth`)
- Implementation references: `AuthController`, `AuthService`, DTOs in `DTOs/Auth`.

**Register — `POST /api/auth/register`**

- Purpose: Create a new user (roles: `citizen`, `officer`, `admin`).

- Request JSON (RegisterRequestDto):

	- `username` (string, required): 3–50 chars; regex ^[a-zA-Z0-9_]+$ (letters, digits, underscores).
	- `password` (string, required): 8–100 chars; must contain uppercase, lowercase, digit, and special character.
	**SCRUM-13 — Auth API contract**

	**Summary**
	This document is about the API contract for authentication endpoints `POST /api/auth/register` and `POST /api/auth/login`.
	It shows request and response shapes, example payloads, error handling rules, and simple security advice. The content is from reading code in the project.

	**Scope**
	- Endpoints: `POST /api/auth/register`, `POST /api/auth/login` (base route: `/api/auth`)
	- Implementation references: `AuthController`, `AuthService`, DTOs in `DTOs/Auth`.

	**Register — `POST /api/auth/register`**

	- Purpose: Create new user. Roles allowed: `citizen`, `officer`, `admin`.

	- Request JSON (RegisterRequestDto):

		- `username` (string, required): 3–50 chars; regex ^[a-zA-Z0-9_]+$ (letters, digits, underscore).
		- `password` (string, required): 8–100 chars; must contain uppercase, lowercase, digit, and special character.
		- `email` (string, required): valid email, max 100 chars.
		- `role` (string, required): one of `citizen`, `officer`, `admin` (not case sensitive).
		- `centerId` (int, optional): needed when `role` is `officer`; ignored for others.

	- Example request:

		{
			"username": "jdoe_01",
			"password": "Str0ng!Passw0rd",
			"email": "j.doe@example.com",
			"role": "citizen"
		}

	- Successful response (201 Created) — RegisterResponseDto:

		{
			"userId": 123,
			"username": "jdoe_01",
			"role": "citizen"
		}

	- Error responses:
		- 400 Bad Request — validation or model errors. Response uses `ErrorResponse` with `validationErrors` (field, message, rejectedValue).
		- 409 Conflict — `USERNAME_TAKEN` or `EMAIL_TAKEN` when username or email already used.
		- 422 Unprocessable Entity — `INVALID_ROLE` or `CENTER_REQUIRED` (officer must give `centerId`).
		- 500 Internal Server Error — `INTERNAL_ERROR` for unexpected problems.

	**Login — `POST /api/auth/login`**

	- Purpose: Authenticate user and return JWT access token and a refresh token.

	- Request JSON (LoginRequestDto):

		- `username` (string, required)
		- `password` (string, required)

	- Example request:

		{
			"username": "jdoe_01",
			"password": "Str0ng!Passw0rd"
		}

	- Successful response (200 OK) — LoginResponseDto:

		{
			"token": "<jwt-access-token>",
			"refreshToken": "<base64-random-string>",
			"expiresIn": 3600,
			"role": "citizen"
		}

	- Error responses:
		- 400 Bad Request — validation errors (missing or invalid fields).
		- 401 Unauthorized — `INVALID_CREDENTIALS` (generic message; does not say which field failed).
		- 403 Forbidden — `ACCOUNT_DISABLED` when account is deactivated.
		- 500 Internal Server Error — `INTERNAL_ERROR`.

	**Error response format**

	API uses a standard error wrapper `ErrorResponse` for most errors. Fields:

	- `success`: false
	- `code`: machine name for error (e.g., `INVALID_CREDENTIALS`, `EMAIL_TAKEN`)
	- `message`: message for user
	- `details`: optional debug info (only in development)
	- `validationErrors`: optional list of `{ field, message, rejectedValue }`
	- `timestamp`, `path`, `correlationId`

	Example validation error (400):

	{
		"success": false,
		"code": "VALIDATION_ERROR",
		"message": "One or more validation errors occurred",
		"validationErrors": [
			{ "field": "password", "message": "Password must contain...", "rejectedValue": "short" }
		],
		"timestamp": "2026-03-01T12:00:00Z",
		"path": "/api/auth/register",
		"correlationId": "..."
	}

	Example auth error (401):

	{
		"success": false,
		"code": "INVALID_CREDENTIALS",
		"message": "Invalid username or password.",
		"timestamp": "2026-03-01T12:05:00Z",
		"path": "/api/auth/login",
		"correlationId": "..."
	}

	**Implementation notes (observed in code)**

	- Passwords hashed with BCrypt (`BCrypt.Net.BCrypt.HashPassword`) using work factor 12.
	- Roles: `citizen`, `officer`, `admin`. Role check is case-insensitive; `officer` needs `centerId`.
	- Login uses `BCrypt.Net.BCrypt.Verify` and returns generic `INVALID_CREDENTIALS` if fail.
	- Access tokens are JWT signed with HMAC-SHA256. Claims: `sub` (user id), `unique_name` (username), `role`, `jti`.
	- Refresh tokens are random 64 bytes and Base64-encoded. It is recommended to store or hash them server-side for rotation.
	- Email verification endpoint `/api/auth/verify-email` exists but registration currently does not send verification.

	**Security best practices & recommendations**

	- Transport: Use HTTPS for all requests in production.
	- Passwords: Keep using BCrypt with good work factor (12 here). Do not log plain passwords.
	- Error messages: Keep login errors generic to avoid user enumeration.
	- Tokens:
		- Keep access tokens short lived (`Jwt:AccessTokenExpiryMinutes`).
		- Use refresh tokens and rotate them; store hashed copy to allow revoke.
		- If using cookies, set `HttpOnly`, `Secure`, `SameSite`; otherwise use `Authorization: Bearer`.
	- Rate limiting & lockout: Add throttling and account lockout for many failed logins.
	- Validation: Server-side validation is present. Also sanitize inputs.
	- Logging: Log auth events with correlation id, but never log secrets.
	- Least privilege: Check roles and permissions properly.
	- CSRF: If cookie auth used, add CSRF protection.
	- Secrets: Put JWT secret and other secrets to environment or secret store, not in source control.

	**Testing & QA checklist**

	- Unit tests for `AuthService.RegisterAsync` and `LoginAsync` for success and error cases.
	- Integration tests for `POST /api/auth/register` and `POST /api/auth/login` checking status and response.
	- Security tests for brute-force, token tampering and replay.

	**Next steps**

	- Add curl or Postman examples for API consumers (I can add if you want).
	- Implement refresh-token persistence and rotation.
	- Add rate-limiting middleware and account lockout.

	---
	Document made after reading `AuthController`, `AuthService`, and DTO files in `backend/QueueLanka.API`.
