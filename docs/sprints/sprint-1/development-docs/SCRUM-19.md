**SCRUM-19 — How to register and login (User Guide)**

**Summary**
This guide is for new users who want to use the booking system. It shows simple steps to register account and login. Also it has troubleshooting tips and where to put screenshots.

**Scope**
- This document covers creating account (register) and login steps for normal users.
- Screenshots should be added in `docs/sprints/sprint-1/development-docs/assets/screenshots/` (see image placeholders below).

**Register — step by step**

1. Open website and go to `Register` or visit `/auth/register` page.
2. Fill fields:
   - Username: only letters, numbers, underscore, 3–50 characters.
   - Email: a valid email address.
   - Password: at least 8 characters and include uppercase, lowercase, number and special char.
   - Role: choose `citizen` if you are normal user. If you are `officer` you must enter `centerId` (ask admin for correct id).
3. Click `Submit` or `Register` button.
4. If registration success you will see message and your user id. Now you can login.

**Login — step by step**

1. Go to `Login` or `/auth/login` page.
2. Enter your `username` and `password`.
3. Click `Login`.
4. If success, you receive access token and refresh token and go to dashboard.

**Screenshots**

- `docs/sprints/sprint-1/development-docs/assets/screenshots/register.png` — registration form filled example
- `docs/sprints/sprint-1/development-docs/assets/screenshots/register-success.png` — registration success message
- `docs/sprints/sprint-1/development-docs/assets/screenshots/login.png` — login form
- `docs/sprints/sprint-1/development-docs/assets/screenshots/login-success.png` — logged in dashboard

**Common problems and troubleshooting**

- Problem: "I get validation error for password"
  - Cause: password missing required characters or too short.
  - Fix: use at least 8 characters and include uppercase, lowercase, number and special symbol.

- Problem: "Username or email already registered"
  - Cause: account exists with same username or email.
  - Fix: try login or use different email/username. If you forgot password contact support.

- Problem: "Invalid credentials" on login
  - Cause: wrong username or password.
  - Fix: check spelling, caps lock, and try password reset if still not working.

- Problem: "Account is deactivated"
  - Cause: admin disabled your account.
  - Fix: contact support or admin to reactivate account.

- Problem: "Cannot register as officer — centerId required"
  - Cause: officer role needs center id.
  - Fix: ask service center admin for the correct `centerId` and enter it.

**Security tips for users**

- Use strong password and do not share it.
- If you are on public computer, logout and close browser.
- Use secure network (avoid public Wi-Fi) when possible.

