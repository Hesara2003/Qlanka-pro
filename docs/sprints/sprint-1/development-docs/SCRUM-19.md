# SCRUM-19  User Registration and Login Guide

## Summary

Step-by-step guide for end users registering and logging in to QueueLanka Pro. Content reflects the actual behaviour observed in `AuthService.cs` and `AuthController.cs` as implemented in Sprint 1.

---

## Before You Start

- You need a web browser and internet access.
- The frontend runs at `http://localhost:5173` (local dev) or the deployed URL.
- API base: `http://localhost:5000/api` (local dev).

---

## Registration

### Step-by-step

1. Navigate to `/register` (or click **Register** on the landing page).
2. Fill in the form:

   | Field | Rules |
   |-------|-------|
   | **Username** | 3 to 50 characters; letters, digits, and underscores only. |
   | **Email** | Valid email address; max 100 characters. |
   | **Password** | 8 to 100 characters; must include uppercase, lowercase, digit, and special character. |
   | **Role** | Choose `citizen` (regular user) or `officer` (service center staff). |
   | **Center ID** | Required only for `officer` role. Ask your admin for the correct ID. |

3. Click **Submit / Register**.
4. On success you receive `201 Created` with:
   ```json
   { "userId": 42, "username": "jdoe_01", "role": "citizen" }
   ```
5. You can log in immediately. No email verification step is required in the current build (email verification is disabled in Sprint 1).

### What the system does on registration

- Hashes your password with BCrypt (work factor 12) before storing. Plain passwords are never saved.
- Checks for duplicate username and email; returns an error if either exists.
- Sets your account to active and email-verified by default.

---

## Login

### Step-by-step

1. Navigate to `/login` (or click **Login** on the landing page).
2. Enter your **username** and **password**.
3. Click **Login**.
4. On success (`200 OK`) you receive:

   ```json
   {
     "token": "<jwt-access-token>",
     "refreshToken": "<base64-string>",
     "expiresIn": 3600,
     "role": "citizen"
   }
   ```

   - `token` is the JWT access token, valid for 60 minutes.
   - `refreshToken` is the long-lived token (7 days) used to renew the access token.
   - `expiresIn` is seconds until access token expires (3600 = 60 min).

5. The frontend attaches `Authorization: Bearer <token>` to all subsequent API requests automatically.

---

## Common Problems and Fixes

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Validation error on password | Password too short or missing required char types. | Use at least 8 chars with uppercase, lowercase, digit, and special char. |
| `DUPLICATE_USERNAME` | Username already taken. | Choose a different username. |
| `DUPLICATE_EMAIL` | Email already registered. | Log in with that email or use a different one. |
| `INVALID_ROLE` | Role submitted is not citizen, officer, or admin. | Select from the listed roles. |
| `CENTER_REQUIRED` | Chose officer role but left Center ID empty. | Enter the Center ID provided by your admin. |
| `INVALID_CREDENTIALS` on login | Wrong username or password. | Check spelling, turn off Caps Lock, try again. Error is intentionally generic. |
| `ACCOUNT_DISABLED` | Admin has disabled your account. | Contact your system administrator. |
| Token expired on next request | Access token valid for 60 min only. | Log in again or wait for the frontend to auto-refresh via the refresh token. |

---

## Security Tips

- Use a strong, unique password.
- Never share your password or access token.
- On a shared computer, log out before closing the browser.
- Access tokens expire in 60 minutes; refresh tokens expire in 7 days.
- The system never says which field caused a login failure to prevent user enumeration attacks.

---

## Screenshots

Place screenshots in `docs/sprints/sprint-1/development-docs/assets/screenshots/`:

| Filename | Description |
|----------|-------------|
| `register-form.png` | Registration form with fields filled |
| `register-success.png` | Success message after registration |
| `login-form.png` | Login page |
| `login-success.png` | Dashboard after successful login |

---

*Document generated from source code: `AuthController.cs`, `AuthService.cs`, `RegisterPage.tsx`, `LoginPage.tsx`.*
