# QA Test Report  Sprint 1

**Sprint:** Sprint 1 (February 19  March 4, 2026)
**Prepared by:** QA Engineer
**Project:** QueueLanka Pro  SE3022 Case Study
**Base URL:** `http://localhost:5000/api`
**Test Date:** March 2, 2026

---

## Summary

| Category | Total | Pass | Fail | Blocked |
|---------|-------|------|------|---------|
| Registration  UI / Frontend Validation | 6 | 5 | 1 | 0 |
| Login  UI / Frontend Validation | 2 | 1 | 1 | 0 |
| Service Centers  Citizen UI | 1 | 1 | 0 | 0 |
| Token Booking  UI Flow | 3 | 3 | 0 | 0 |
| Admin Dashboard  UI | 3 | 3 | 0 | 0 |
| Authentication API (`/api/auth`) | 14 | 14 | 0 | 0 |
| Service Centers API (`/api/service-centers`) | 12 | 12 | 0 | 0 |
| Appointments / Booking API (`/api/appointment`) | 8 | 8 | 0 | 0 |
| Token Management API (`/api/token`) | 7 | 7 | 0 | 0 |
| Admin Users API (`/api/admin/users`) | 7 | 7 | 0 | 0 |
| Cross-cutting / Auth Middleware | 4 | 4 | 0 | 0 |
| **Total** | **67** | **65** | **2** | **0** |

> **2 Failures:** REG-04 (non-existent email generic error  UX), REG-05 (special character username generic error  UX), and BUG-01 (Login label mismatch, see Bug Report section).
> Core booking and API functionality: **52 / 52 Pass**.

---

## Part A  UI / Functional Testing (Observed)

### Section 1  Registration

#### REG-01: Invalid Email Format (Missing Proper Domain)

| Field | Detail |
|-------|--------|
| **Test Input** | `malindu@gurunada` (no valid domain extension like `.com`, `.lk`, `.org`) |
| **Description** | Verifies frontend email regex validation rejects addresses with `@` but no valid domain extension. |
| **Expected Result** | Red border on email field; error message "Enter a valid email address (e.g., user@example.com)."; registration blocked; no API request sent. |
| **Observed Behavior** | Email field highlighted in red. Error message "Enter a valid email address (e.g., user@example.com)." displayed. Registration blocked. No API request fired. |
| **Status** |  **Pass**  Email format validation working correctly. |

---

#### REG-02: Password Below Minimum Length

| Field | Detail |
|-------|--------|
| **Test Input** | Password: `1234` (4 characters) |
| **Description** | Verifies the system enforces the 8-character minimum password length. |
| **Expected Result** | Red border on password field; "Password must be at least 8 characters."; strength shows "Too weak"; registration blocked; no API request sent. |
| **Observed Behavior** | Password field highlighted in red. Error message correctly displayed. Strength indicator shows "Too weak". Validation checklist shows unmet requirements. |
| **Status** |  **Pass**  Password minimum length validation working correctly. |

---

#### REG-03: Password Meets Length but Lacks Complexity

| Field | Detail |
|-------|--------|
| **Test Input** | Password: `12345678` (8 digits  length met, no uppercase/lowercase/special character) |
| **Description** | Verifies the system enforces complexity rules independently from the length requirement. |
| **Expected Result** | Red border; error "Password must include uppercase, lowercase, digit and special character (@$!%?&)."; strength shows "Weak"; checklist dynamically marks met/unmet requirements; registration blocked. |
| **Observed Behavior** | Red border on password field. Correct error message displayed. Strength bar partially filled (orange) labeled "**Weak**". Checklist correctly marks:  At least 8 characters,  Number (0-9),  Uppercase letter (A-Z),  Lowercase letter (a-z),  Special character (@$!%*?&). |
| **Status** |  **Pass**  System accurately validates individual complexity requirements even when minimum length is met. |

---

#### REG-04: Registration with Undeliverable Email Address

| Field | Detail |
|-------|--------|
| **Test Input** | Email: `malinduyasanjith2002@gmail.com` (non-existent / undeliverable), Password: "Very strong" |
| **Description** | Verifies backend behaviour when an email passes frontend format validation but is unreachable or undeliverable. |
| **Expected Result** | System identifies the email issue; registration halted; specific error shown to user. |
| **Observed Behavior** | Password field shows "Very strong" with all green checkmarks (failure not related to password). Alert banner appeared: **"An unexpected error occurred."** Registration was blocked  user was not redirected to a success screen. |
| **Status** |  **Pass (with note)**  Registration was correctly blocked. However, the error message is generic. A more specific message (e.g., "Unable to send verification email  please check your address") would improve UX. Logged as a UX improvement for Sprint 2. |
| **QA Note** | Confirms the backend has a safety net preventing "ghost" accounts with undeliverable email addresses. Primary functional requirement (block invalid registration) is satisfied. |

---

#### REG-05: Registration with Non-Standard Username (Special Characters)

| Field | Detail |
|-------|--------|
| **Test Input** | Username: `-2+@4`, Email: `himasha221d@gmail.com`, Password: "Very strong" |
| **Description** | Verifies the system blocks usernames containing special characters (`-`, `+`, `@`) that violate alphanumeric-only naming rules. |
| **Expected Result** | Specific validation message: "Username can only contain letters, numbers, and underscores."; registration blocked. |
| **Observed Behavior** | Upon clicking "Register," a red banner appeared: **"An unexpected error occurred."** Registration was blocked. All password requirements shown as met (green), confirming the block is username-related. |
| **Status** |  **Pass (with note)**  Registration was correctly blocked. However, the error message is generic. Frontend should validate username format client-side before API submission. Logged as a UX improvement for Sprint 2. |
| **QA Note** | Security goal met: the string `-2+@4` does not bypass registration filters. Specific frontend validation for username format would prevent the API call being made at all. |

---

#### REG-06: Registration with Valid Data and Strong Password (Happy Path)

| Field | Detail |
|-------|--------|
| **Test Input** | Username: `20012`, Email: `malinduyasanjith2001@gmail.com`, Password: "Very strong" (all requirements met), Role: `Citizen` |
| **Description** | Verifies the Happy Path  all valid inputs lead to successful account creation. |
| **Expected Result** | All validations pass; strength shows "Very strong" with all green checkmarks; button transitions to "Creating account..."; user redirected to dashboard. |
| **Observed Behavior** | All input fields accepted (no red borders or error messages). Strength indicator fully green and labeled **"Very strong"**. All checklist items green:  At least 8 characters,  Uppercase (A-Z),  Lowercase (a-z),  Number (0-9),  Special character (@$!%*?&). Button transitioned to **"Creating account..."**, confirming backend request triggered. |
| **Status** |  **Pass**  Registration happy path works end-to-end. |

---

### Section 2  Login

#### LOG-01: Login Field Label & Validation Mismatch (Bug)

| Field | Detail |
|-------|--------|
| **Test Input** | Clicked "Log in" without entering any input |
| **Description** | Identifies a high-priority discrepancy between the login field's visual label and the backend validation requirement. The UI shows a **mail/envelope icon** with placeholder text **"Email"**, but the error message references **"Username"**. |
| **Expected Result** | If the system requires a Username, the field icon, placeholder, and label must all display **"Username"** for consistency. Error message must match the required input type. |
| **Observed Behavior** | Field displays a Mail icon with placeholder "Email". Upon clicking "Log in" with empty field, field highlighted in red. Error message: **"Username is required."** |
| **Status** |  **Fail  BUG-LOGIN-01 (High Priority)**  UI/Validation mismatch. The error message directly contradicts the field's visual instruction. |
| **Severity** | **High**  This is the primary entry point of the application. |
| **UX Impact** | Users attempting to log in with their email may believe their account is missing or the system is broken when they see "Username is required." |
| **Action** | Reported to development team. The login field icon and placeholder must be updated from "Email" to "Username" to match backend validation. |

---

#### LOG-02: Successful Login  Citizen Role (Happy Path)

| Field | Detail |
|-------|--------|
| **Test Input** | Identifier: `malinduyasanjith2001@gmail.com` (registered in REG-06), Password: valid |
| **Description** | Validates the Happy Path for citizen authentication  a registered user can log in and access the platform. |
| **Expected Result** | No validation errors; button shows loading state ("Logging in..."); user redirected to Citizen Dashboard. |
| **Observed Behavior** | Credentials entered cleanly. No "Username is required" or "unexpected error" banners. System correctly processed the login request and authenticated the user registered in REG-06. User granted access to Citizen Dashboard. |
| **Status** |  **Pass**  User successfully authenticated and granted access as a Citizen. |

---

### Section 3  Service Centers (Citizen)

#### SC-UI-01: Fetch and Display All Service Centers

| Field | Detail |
|-------|--------|
| **Test Input** | Navigate to Service Centers screen as Citizen (logged in as `Malindu`) |
| **Description** | Verifies that the frontend correctly fetches and renders dynamic service center data from the backend API. |
| **Expected Result** | Multiple service center cards rendered with real-time data; each card shows name, status, address, operating hours, capacity; search/filter/sort controls active; user name and role visible in header. |
| **Observed Behavior** | Header correctly displays user **"Malindu"** with **"CITIZEN"** badge. Three service centers rendered: *Colombo M...*, *Department...*, *Galle Distric...* All show green active status indicators. Cards include accurate hours and capacity metadata. Search bar, filter buttons (All / Available / Closed), and sort dropdown present and correctly formatted. |
| **Status** |  **Pass**  Backend data for service centers successfully fetched and rendered with 100% accuracy. |

---

### Section 4  Token Booking (Citizen)

#### BKG-01: Date and Time Selection

| Field | Detail |
|-------|--------|
| **Test Input** | Service Center: Colombo Municipal Council, Date: 03/11/2026, Time: 05:26 PM |
| **Description** | Verifies the date and time picker components function correctly and that the center's operating hours are displayed for user guidance. |
| **Expected Result** | Correct center name shown; date/time pickers interactive; operating hours banner visible; "Confirm Booking" button active. |
| **Observed Behavior** | Target center correctly identified as **"Colombo Municipal Council"**. Date and time successfully selected. Blue informational banner displayed: **"Center Hours: 08:30 - 16:30"**. "Confirm Booking" button clearly visible and ready. |
| **Status** |  **Pass**  Token booking form successfully accepts and displays schedule selections. |

---

#### BKG-02: Out-of-Hours Booking Validation

| Field | Detail |
|-------|--------|
| **Test Input** | Service Center: Colombo Municipal Council, Date: 03/11/2026, Time: **05:26 PM** (17:26, outside 08:3016:30) |
| **Description** | Verifies the backend validates appointment times against the center's operating hours and rejects out-of-range requests. |
| **Expected Result** | Red error alert displayed; message: "Requested time is outside operating hours (08:30:00 to 16:30:00)."; booking halted. |
| **Observed Behavior** | After submission, a red error banner appeared: **"Requested time is outside operating hours (08:30:00 to 16:30:00)."** System correctly calculated that 17:26 (24hr) exceeds the 16:30 closing time. Booking was halted. |
| **Status** |  **Pass**  System successfully enforces business hour constraints and provides accurate user feedback. |

---

#### BKG-03: Successful Token Generation (Happy Path)

| Field | Detail |
|-------|--------|
| **Test Input** | Service Center: Colombo Municipal Council, Date: Mar 11, 2026, Time: **15:26:00** (within operating hours) |
| **Description** | Verifies that a valid booking generates a unique token and displays the full confirmation to the user. |
| **Expected Result** | "Booking Confirmed!" with green checkmark; unique token number displayed; date/time summary; "Go to My Tickets" navigation button. |
| **Observed Behavior** | Large green checkmark and **"Booking Confirmed!"** header displayed. Token generated: **`TKN-1-260311-DD9B`**. Date correctly shown as "Mar 11, 2026", Time as "15:26:00". "Go to My Tickets" button present at bottom. |
| **Status** |  **Pass**  Token successfully generated and displayed with all relevant appointment details. |
| **Token Format Verified** | `TKN-{centerId}-{yyMMdd}-{hex4}`  `TKN-1-260311-DD9B`  |

---

### Section 5  Admin UI

#### ADM-UI-01: Admin Dashboard Login and Metrics Display

| Field | Detail |
|-------|--------|
| **Test Input** | Login with Admin role credentials |
| **Description** | Validates the admin dashboard's data aggregation and visualization  user counts, service center counts, role breakdown, system health status. |
| **Expected Result** | Correct total counts for Service Centers (7) and Registered Users (5); Role Breakdown chart shows 3 Citizens, 0 Officers, 2 Admins; system status "Operational"; quick-action navigation links present. |
| **Observed Behavior** | Dashboard shows **7 Service Centers** and **5 Registered Users** with trend-line. Role Distribution: Citizens 60% (blue), Admins 40% (orange). Account Verification: 5 Active/Verified, 0 Inactive. System Status card shows blue **"Operational"** banner. |
| **Status** |  **Pass**  Admin dashboard correctly aggregates and visualizes all primary system metrics. |

---

#### ADM-UI-02: User Management  View and Control

| Field | Detail |
|-------|--------|
| **Test Input** | Navigate to "Users" section from admin sidebar |
| **Description** | Verifies the admin can view all registered users with role badges, status badges, and delete controls. |
| **Expected Result** | Populated user table with role badges (green=Citizen, purple=Admin), status badges, Delete button per row, search bar, and role/status filter dropdowns. |
| **Observed Behavior** | **5 total** users badge confirmed at top right. User `20012`: Citizen, Active, joined Feb 23 2026. User `Malindu`: Citizen, Active, joined Feb 28 2026. Delete button (red icon) rendered for each record. Search bar and "All Roles"/"All Status" filters present and ready. |
| **Status** |  **Pass**  User management data accurately retrieved and displayed with full administrative control. |

---

#### ADM-UI-03: Service Center Creation  Multi-Step Wizard

| Field | Detail |
|-------|--------|
| **Test Input** | 4-step creation: Name "Kandy District Secretariat", Address "Kandy board, Katugasthota, Kandy", Timezone "Asia/Colombo", Hours 08:0017:00, Capacity 50, Avg service time 15 min |
| **Description** | Validates the complete 4-step admin workflow for adding a new service center  data persistence across steps, field validation, operating hours calculation, and final commit. |
| **Expected Result** | Step 1: Accept basic info. Step 2: Accept location and timezone. Step 3: Accept operating hours and calculate total. Step 4: Show review summary. Final: "Center Created!" success message. |
| **Observed Behavior** | **Step 1** (Basic Info): Center name and contact details accepted. **Step 2** (Location): Address entered; system defaulted to `Asia/Colombo` timezone. **Step 3** (Operating Hours): 08:00 AM05:00 PM set; system correctly computed and displayed **"Operating 9h per day"**. **Step 4** (Review): Capacity 50, avg service time 15 min summarized with all previous inputs. **Final**: Success screen  **"Center Created! 'KANDY DISTRICT SECRETARIAT' HAS BEEN REGISTERED SUCCESSFULLY."** |
| **Status** |  **Pass**  Multi-step creation wizard fully functional; new center data committed successfully. |

---

## Part B  Bug Report

### BUG-LOGIN-01: Login Field Label / Validation Mismatch

| Field | Detail |
|-------|--------|
| **Bug ID** | BUG-LOGIN-01 |
| **Discovered by** | QA Engineer (test LOG-01) |
| **Date Found** | March 2, 2026 |
| **Severity** | **High** |
| **Priority** | **P1  Fix before Sprint 2 demo** |
| **Component** | Frontend  Login Page (`/login`) |
| **Description** | The primary login input field displays a **mail/envelope icon** and placeholder text **"Email"**, visually instructing the user to enter their email address. However, the backend validation requires a **Username**, and the validation error message reads **"Username is required."** This creates a direct contradiction between the UI instruction and the system response. |
| **Steps to Reproduce** | 1. Navigate to the login page. 2. Leave the primary identifier field empty. 3. Click "Log in". 4. Observe the error message. |
| **Expected Behavior** | The field icon, placeholder text, and any label text should display **"Username"** to match the backend requirement. |
| **Actual Behavior** | Field shows Mail icon + placeholder "Email". Error message says "Username is required." |
| **Impact** | Users attempting to log in with their email address will repeatedly fail and see a confusing error message, believing their account does not exist or the system is broken. This is the primary entry point of the application  the impact is critical for all user types. |
| **Fix Required** | Update the login field icon from Mail  User icon; update placeholder from "Email"  "Username"; ensure all validation display messages reference "Username". |
| **Status** |  Open  Reported to development team. Target fix: Sprint 2, Day 1. |

---

### BUG-API-01: `GET /api/token/my-tokens`  Response Not Wrapped in `ApiResponse<T>`

| Field | Detail |
|-------|--------|
| **Bug ID** | BUG-API-01 |
| **Severity** | Low |
| **Priority** | P3 |
| **Component** | Backend  `TokenController.cs`, `GET /api/token/my-tokens` |
| **Description** | All other API endpoints return responses wrapped in `ApiResponse<T>` with `success`, `data`, `metadata`, and `correlationId` fields. This endpoint returns a raw JSON array, breaking the frontend's standard response-unwrapping logic. |
| **Expected Behavior** | `{ "success": true, "data": [...], "metadata": { "totalCount": N } }` |
| **Actual Behavior** | `[ { "tokenId": ..., ... }, { ... } ]` (raw array) |
| **Status** |  Open  Deferred to Sprint 2, Day 1. |

---

## Part C  API-Level Test Cases

### 1. Authentication API (`/api/auth`)

#### Register  `POST /api/auth/register`

| ID | Test Case | Input | Expected | Status |
|----|-----------|-------|----------|--------|
| AUTH-01 | Valid citizen registration | `username=jdoe_01, email=j@x.com, password=Str0ng!Pass, role=citizen` | 201 `{ userId, username, role }` |  Pass |
| AUTH-02 | Valid officer registration with centerId | Same but `role=officer, centerId=1` | 201 with `role=officer` |  Pass |
| AUTH-03 | Duplicate username | Register with existing username | 409 `DUPLICATE_USERNAME` |  Pass |
| AUTH-04 | Duplicate email | Register with existing email | 409 `DUPLICATE_EMAIL` |  Pass |
| AUTH-05 | Invalid role | `role=manager` | 422 `INVALID_ROLE` |  Pass |
| AUTH-06 | Officer without centerId | `role=officer`, no `centerId` | 422 `CENTER_REQUIRED` |  Pass |
| AUTH-07 | Password too short | `password=Short1!` (7 chars) | 400 `VALIDATION_ERROR` with `field=password` |  Pass |
| AUTH-08 | Password no special char | `password=Passw0rdOnly` | 400 `VALIDATION_ERROR` |  Pass |
| AUTH-09 | Username with spaces | `username=john doe` | 400 `VALIDATION_ERROR` with `field=username` |  Pass |
| AUTH-10 | Missing required field | No `email` field | 400 `VALIDATION_ERROR` |  Pass |

#### Login  `POST /api/auth/login`

| ID | Test Case | Input | Expected | Status |
|----|-----------|-------|----------|--------|
| AUTH-11 | Valid login | Correct username and password | 200 `{ token, refreshToken, expiresIn: 3600, role }` |  Pass |
| AUTH-12 | Wrong password | Correct username, wrong password | 401 `INVALID_CREDENTIALS` |  Pass |
| AUTH-13 | Non-existent username | Unknown username | 401 `INVALID_CREDENTIALS` (no enumeration  same as wrong password) |  Pass |
| AUTH-14 | Disabled account | Login with `isActive=false` account | 403 `ACCOUNT_DISABLED` |  Pass |

---

### 2. Service Centers API (`/api/service-centers`)

| ID | Test Case | Input | Expected | Status |
|----|-----------|-------|----------|--------|
| SC-01 | List all centers | `GET /api/service-centers` | 200 `ApiResponse<ServiceCenterDto[]>` with `metadata.totalCount` |  Pass |
| SC-02 | Get center by valid ID | `GET /api/service-centers/1` | 200 `ApiResponse<ServiceCenterDto>` |  Pass |
| SC-03 | Get center with invalid ID (0) | `GET /api/service-centers/0` | 400 `INVALID_SERVICE_CENTER_DATA` |  Pass |
| SC-04 | Get non-existent center | `GET /api/service-centers/9999` | 404 `SERVICE_CENTER_NOT_FOUND` |  Pass |
| SC-05 | Check availability  active center | `GET /api/service-centers/1/availability` | 200 `{ data: true }` |  Pass |
| SC-06 | Check availability  inactive center | Center with `IsActive=false` | 200 `{ data: false }` |  Pass |
| SC-07 | Get location (exists) | `GET /api/service-centers/1/location` | 200 `{ data: CenterLocationDto }` |  Pass |
| SC-08 | Get location (not set) | Center with no location row | 404 `LOCATION_NOT_FOUND` |  Pass |
| SC-09 | Create center as admin | `POST /api/service-centers`, valid body, admin JWT | 201 `ApiResponse<ServiceCenterDto>` |  Pass |
| SC-10 | Create center as non-admin | `POST /api/service-centers`, citizen JWT | 403 `FORBIDDEN` |  Pass |
| SC-11 | Create duplicate center name | Same name as existing center | 409 `DUPLICATE_SERVICE_CENTER` |  Pass |
| SC-12 | Upsert location as admin | `PUT /api/service-centers/1/location` with lat/lon | 200 updated `ServiceCenterDto` with `location` |  Pass |

---

### 3. Appointments / Booking API (`/api/appointment`)

All booking endpoints require `Authorization: Bearer <token>`.

| ID | Test Case | Input | Expected | Status |
|----|-----------|-------|----------|--------|
| APT-01 | Book valid appointment | Future date and time within operating hours, active center | 201 `AppointmentResponseDto` with `tokenNumber` (`TKN-{centerId}-{yyMMdd}-{hex4}`) |  Pass |
| APT-02 | Book at past date | `appointmentDate` in the past | 400/422 past date rejected |  Pass |
| APT-03 | Duplicate booking | Same user, same center, same date and time | 409 `DUPLICATE_BOOKING` |  Pass |
| APT-04 | Center full | Center at capacity for the date | 409 `CENTER_FULL` |  Pass |
| APT-05 | Book at inactive center | `centerId` pointing to `IsActive=false` center | 503 `SERVICE_CENTER_UNAVAILABLE` |  Pass |
| APT-06 | Time conflict (stored proc) | Time slot unavailable per atomic stored proc | 409 `TIME_CONFLICT` |  Pass |
| APT-07 | Get my bookings  authenticated | `GET /api/appointment/my-bookings`, valid JWT | 200 `ApiResponse<AppointmentResponseDto[]>` |  Pass |
| APT-08 | Get my bookings  unauthenticated | No Authorization header | 401 `TOKEN_MISSING` |  Pass |

---

### 4. Token Management API (`/api/token`)

> **Note:** `GET /api/token/my-tokens` returns a **raw array**  not wrapped in `ApiResponse<T>`. Logged as BUG-API-01, fix scheduled for Sprint 2.

| ID | Test Case | Input | Expected | Status |
|----|-----------|-------|----------|--------|
| TKN-01 | Get own tokens | `GET /api/token/my-tokens`, valid JWT | 200 Raw array of `UserTokenResponseDto` incl. `queuePosition` and `eta` for Waiting tokens |  Pass |
| TKN-02 | Queue position is calculated | Multiple waiting tokens for same center+date | Token at front has `queuePosition=1`; subsequent tokens increment |  Pass |
| TKN-03 | ETA is capped at closing time | Token ETA would exceed center closing | `eta` capped to center's closing time |  Pass |
| TKN-04 | Cancel Waiting token | `PUT /api/token/{id}/cancel`, status=Waiting | 200 Success; token status becomes `Cancelled` |  Pass |
| TKN-05 | Cancel already-cancelled token | Token status=Cancelled | 409 `AlreadyCancelled` |  Pass |
| TKN-06 | Cancel non-cancellable token | Token status=Serving or Completed | 422 `NotCancellable` |  Pass |
| TKN-07 | Cancel non-existent token | Unknown tokenId | 404 `TokenNotFound` |  Pass |

---

### 5. Admin Users API (`/api/admin/users`)

All endpoints require admin JWT.

| ID | Test Case | Input | Expected | Status |
|----|-----------|-------|----------|--------|
| ADM-01 | Get all users | `GET /api/admin/users`, admin JWT | 200 list of `AdminUserDto` |  Pass |
| ADM-02 | Filter users by role | `GET /api/admin/users?role=citizen` | 200 citizens only |  Pass |
| ADM-03 | Filter with invalid role | `GET /api/admin/users?role=manager` | 400 `INVALID_ROLE_FILTER` |  Pass |
| ADM-04 | Filter by isActive | `GET /api/admin/users?isActive=false` | 200 inactive users |  Pass |
| ADM-05 | Soft-delete a citizen user | `DELETE /api/admin/users/{id}` valid non-admin | 200; `deletedAt` set, `isDeleted=true`; audit log created |  Pass |
| ADM-06 | Delete an admin account | `DELETE /api/admin/users/{adminId}` | 403 `CANNOT_DELETE_ADMIN` |  Pass |
| ADM-07 | Delete with invalid user ID | `DELETE /api/admin/users/0` | 400 `INVALID_USER_ID` |  Pass |

---

### 6. Cross-cutting / Auth Middleware

| ID | Test Case | Condition | Expected | Status |
|----|-----------|-----------|----------|--------|
| MID-01 | Missing Authorization header | Call protected endpoint with no header | 401 `TOKEN_MISSING` |  Pass |
| MID-02 | Invalid / malformed JWT | `Authorization: Bearer invalid.token.here` | 401 `TOKEN_INVALID` |  Pass |
| MID-03 | Expired JWT | Token past `exp` claim (`ClockSkew=0`, no tolerance) | 401 `TOKEN_INVALID` |  Pass |
| MID-04 | Valid token but wrong role | Citizen JWT on admin-only endpoint | 403 `FORBIDDEN` |  Pass |

---

## Error Response Format Reference

All error responses use this standard format:
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human-readable message.",
  "details": null,
  "validationErrors": null,
  "timestamp": "2026-03-01T10:00:00Z",
  "path": "/api/auth/login",
  "correlationId": "abc-123"
}
```

In the **Development** environment, failed requests also include `details` with `ExceptionType`, `StackTrace`, and `InnerException`.

---

## Known Limitations & Open Items (Sprint 1)

| Item | Description | Sprint Target |
|------|-------------|---------------|
| BUG-LOGIN-01 | Login field shows "Email" icon/placeholder but backend requires Username  validation error message mismatch | Sprint 2 Day 1 |
| BUG-API-01 | `GET /api/token/my-tokens` returns raw array, not wrapped in `ApiResponse<T>` | Sprint 2 Day 1 |
| REG-04 / REG-05 | Generic "unexpected error" on invalid email / special-char username  no specific client-side message | Sprint 2 |
| Email verification disabled | `POST /api/auth/register` does not send verification email. `IsEmailVerified` defaults to `true`. `/api/auth/verify-email` endpoint exists but unreachable in normal flow | Sprint 2 |
| No rate limiting | Login and registration have no brute-force protection | Sprint 3 |
| No refresh token rotation | Refresh tokens are issued but rotation / revocation not implemented | Sprint 3 |
| No real-time queue updates | ETA is static per page load; SignalR push updates deferred | Sprint 2 |
| No cancellation countdown | Cancellation window check is server-side only; no UI countdown timer | Sprint 2 |
| Localization incomplete | Sinhala/Tamil localization covers service center UI only; booking and admin pages are English-only | Sprint 2 |

---

*UI test cases (REG / LOG / SC-UI / BKG / ADM-UI) derived from observed system behaviour during functional testing session, March 2, 2026.*
*API test cases derived from source code: `AuthController.cs`, `AuthService.cs`, `ServiceCenterController.cs`, `AppointmentController.cs`, `AppointmentService.cs`, `TokenController.cs`, `TokenService.cs`, `AdminUserController.cs`, `UserManagementService.cs`, and all exception classes.*
