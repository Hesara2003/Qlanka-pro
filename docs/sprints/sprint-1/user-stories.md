# User Story Document (Detailed)  Sprint 1

**Sprint:** Sprint 1 (February 19  March 4, 2026)
**Project:** QueueLanka Pro  SE3022 Case Study
**Document Owner:** Business Analyst
**Last Updated:** March 4, 2026

All user stories are derived from the feature branches created during Sprint 1:
`feature/SCRUM-XX-*` branches in the `Qlanka-pro` repository.
Ticket IDs, story point values, and statuses reflect the Jira board as of Sprint 1 close.

---

## User Story Index

| ID | Jira Epic Ticket | Title | Epic | SP | Status |
|----|-----------------|-------|------|----|--------|
| US-C-01 | SCRUM-5 | Register / Login | USER AUTHENTICATION | 5 | Done |
| US-C-02 | SCRUM-21 | View Service Centers | CITIZEN SERVICE CENTER | 3 | Done |
| US-C-03 | SCRUM-36 | Book a Token | TOKEN BOOKING & QUEUE MGMT | 8 | Testing |
| US-C-04 | SCRUM-46 | View My Token & ETA | TOKEN BOOKING & QUEUE MGMT | 5 | Testing |
| US-C-05 | SCRUM-53 | Cancel My Booking | TOKEN BOOKING & QUEUE MGMT | 3 | Testing |
| US-A-01 | SCRUM-64 | Create & View Service Centers (Admin) | ADMIN SERVICE CENTER MGMT | 3 | Testing |
| US-A-02 | SCRUM-75 | View & Delete Users (Admin) | ADMIN USER MANAGEMENT | 3 | Testing |
| US-D-01 | SCRUM-84 | CI Pipeline | CI/CD & DEVOPS INFRASTRUCTURE | 5 | Idea |
| US-D-02 | SCRUM-89 | Docker & Docker Compose | CI/CD & DEVOPS INFRASTRUCTURE | 3 | Idea |
| US-D-03 | SCRUM-94 | Staging / Demo Deployment | CI/CD & DEVOPS INFRASTRUCTURE | 2 | Idea |
|  | SCRUM-32 | Email Verification | USER AUTHENTICATION | 3 | Deferred  Sprint 2 |
|  | SCRUM-33 | Password Reset | USER AUTHENTICATION | 1 | Deferred  Sprint 4 |

**Total committed SP:** 40 &nbsp;|&nbsp; **Completed:** 36 &nbsp;|&nbsp; **Deferred:** 4 &nbsp;|&nbsp; **Completion rate:** 90%

---

## US-C-01  Register / Login

> **As a user, I want to register and log in to QueueLanka Pro securely so that I can access booking and management features appropriate to my role.**

**Jira Ticket:** SCRUM-5
**Epic:** USER AUTHENTICATION
**Priority:** High
**Story Points:** 5
**Status:** Done
**Sprint branches:** `feature/SCRUM-13`, `feature/SCRUM-15`, `feature/SCRUM-16`, `feature/SCRUM-17`

### Acceptance Criteria

1. A new user can register with username, email, password, and role (`citizen`, `officer`, `admin`).
2. Officer registration requires a valid `centerId`; citizen registration does not.
3. Usernames must be 350 characters, letters/digits/underscore only.
4. Passwords must be 8100 characters with uppercase, lowercase, digit, and special character.
5. Duplicate usernames and emails are rejected with specific error codes (`DUPLICATE_USERNAME`, `DUPLICATE_EMAIL`).
6. Passwords are stored as BCrypt hashes (work factor 12); plain text is never persisted.
7. A registered user can log in with username and password and receive a JWT access token and a refresh token.
8. JWT access token expires in 60 minutes; refresh token expires in 7 days.
9. Login with wrong credentials returns `INVALID_CREDENTIALS` without indicating which field is wrong.
10. Login with a disabled account returns `ACCOUNT_DISABLED`.
11. All protected endpoints reject requests without a valid JWT with `TOKEN_MISSING` or `TOKEN_INVALID`.
12. Role-restricted endpoints (admin, officer) return `FORBIDDEN` for insufficient roles.

### Sub-tasks

| Ticket | Description | Branch | Status |
|--------|-------------|--------|--------|
| SCRUM-13 | Design registration & login API contract | `feature/SCRUM-13-registration-login-api` | Done |
| SCRUM-15 | Implement JWT auth middleware and bearer events | `feature/SCRUM-15-jwt-auth-middleware` | Done |
| SCRUM-16 | Build frontend register and login pages | `feature/SCRUM-16-frontend-auth-forms` | Done |
| SCRUM-17 | Frontend form validation (client-side) | `feature/SCRUM-17-frontend-form-validation` | Done |
| SCRUM-19 | Document registration & login flow for end users | *(docs task)* | Done |
| SCRUM-29 | Implement error handling middleware and standardised `ErrorResponse` | `feature/SCRUM-29-error-handling` | Done |

### Notes

- JWT claims: `sub` (userId), `unique_name` (username), `role`, `jti`, optional `centerId`.
- `ClockSkew = TimeSpan.Zero`  strict token expiry, no tolerance window.
- Custom middleware responds to 401/403 with JSON, not HTML.

---

## US-C-02  View Service Centers

> **As a citizen, I want to browse and search service centers so that I can choose the right center before booking my appointment.**

**Jira Ticket:** SCRUM-21
**Epic:** CITIZEN SERVICE CENTER
**Priority:** High
**Story Points:** 3
**Status:** Done
**Sprint branches:** `feature/SCRUM-23`, `feature/SCRUM-24`, `feature/SCRUM-25`, `feature/SCRUM-35-localization`

### Acceptance Criteria

1. Citizens can view a list of all service centers (name, address, opening/closing times, availability status).
2. The list includes an `isAvailable` flag computed from `IsActive` and the date-specific `CenterAvailability` record (falls back to `CenterOperatingDay` weekly schedule if no date override exists).
3. Citizens can view the detailed location of a center (city, district, latitude/longitude, Google Maps URL, landmark if set).
4. The service center listing page supports search, filter, and sort (UI-side).
5. Selecting a center navigates to the booking page for that center.
6. Requesting a center with an invalid ID returns `INVALID_SERVICE_CENTER_DATA` (400).
7. Requesting a non-existent center returns `SERVICE_CENTER_NOT_FOUND` (404).
8. The center list response includes `metadata.totalCount`.
9. The service center card is accessible: keyboard-navigable, ARIA labels, `aria-pressed` on filter buttons.
10. The UI is available in English, Sinhala (`si`), and Tamil (`ta`) via i18n locale files.

### Sub-tasks

| Ticket | Description | Branch | Status |
|--------|-------------|--------|--------|
| SCRUM-23 | Design and implement center availability schema (`CenterAvailability`, `CenterOperatingDay` tables) | `feature/SCRUM-23-availability-schema` | Done |
| SCRUM-24 | Build service centers listing UI (`ServiceCentersPage`, `ServiceCenterCard`) | `feature/SCRUM-24-service-centers-ui` | Done |
| SCRUM-25 | Frontend API integration for service center listing | `feature/SCRUM-25-api-integration` | Done |
| SCRUM-27 | Document service center viewing feature for end users | *(docs task)* | Done |
| SCRUM-30 | Design API contract for service center listing (all 6 endpoints) | *(docs task)* | Done |
| SCRUM-34 | Conduct accessibility review; apply high-priority fixes | *(review task)* | Done |
| SCRUM-35 | Implement i18n localization  Sinhala and Tamil locale files for service center UI | `feature/SCRUM-35-localization` | Done |

### Notes

- `openingTime`/`closingTime` in the DTO are `string "HH:mm"`, from the availability record or center defaults.
- Auto-refresh with `aria-live="polite"` announcement added per accessibility review.
- Localization covers `ServiceCenterCard`, `ServiceCentersPage` labels and filter buttons.

---

## US-C-03  Book a Token

> **As a citizen, I want to book an appointment token at a service center so that I can secure my place in the queue for a specific date and time.**

**Jira Ticket:** SCRUM-36
**Epic:** TOKEN BOOKING & QUEUE MGMT
**Priority:** High
**Story Points:** 8
**Status:** Testing
**Sprint branches:** `feature/SCRUM-36`, `feature/SCRUM-38`, `feature/SCRUM-39`, `feature/SCRUM-40`, `SCRUM-47`, `feature/SCRUM-48-token-schema-update`

### Acceptance Criteria

1. An authenticated citizen can submit `centerId`, `appointmentDate`, and `appointmentTime` to book a token.
2. Booking a past date or time is rejected.
3. Booking at a center that is not active (`IsActive = false`) returns `SERVICE_CENTER_UNAVAILABLE` (503).
4. If the center has a date-specific closure on the requested date, the booking is rejected.
5. If the appointment time falls outside operating hours, the booking is rejected.
6. Duplicate bookings (same user, same center, same date+time) return `DUPLICATE_BOOKING` (409).
7. If the center is at daily capacity, the booking returns `CENTER_FULL` (409).
8. Time conflicts detected by the atomic stored procedure return `TIME_CONFLICT` (409).
9. On success, the citizen receives an `AppointmentResponseDto` with token number format `TKN-{centerId}-{yyMMdd}-{hex4}`, appointment status `Scheduled`, and token status `Waiting`.
10. A booking confirmation notification is sent asynchronously (fire-and-forget)  delivery does not block the response.
11. The citizen can view all their bookings via `GET /api/appointment/my-bookings`.

### Sub-tasks

| Ticket | Description | Branch | Status |
|--------|-------------|--------|--------|
| SCRUM-36 | Initial appointment database setup and entity scaffold | `feature/SCRUM-36` | Done |
| SCRUM-37 | Design token booking API contract | *(docs task)* | Done |
| SCRUM-38 | Implement appointment booking backend (service, repository, controller) | `feature/SCRUM-38` | Done |
| SCRUM-39 | Token management and schema update (link appointment to token) | `feature/SCRUM-39` | Done |
| SCRUM-40 | Booking frontend integration (`BookingPage` connected to API) | `feature/SCRUM-40` | Done |
| SCRUM-44 | Document token booking process for end users | *(docs task)* | Done |
| SCRUM-47 | Implement token controller (`GET /api/token/my-tokens`) | `SCRUM-47` | Done |
| SCRUM-48 | Token schema update (add `cancelled_at`, `queue_position` columns) | `feature/SCRUM-48-token-schema-update` | Done |

### Notes

- Booking uses an **atomic stored procedure** (`BookAtomicAsync`) to prevent race conditions.
- Token number format: `TKN-{centerId}-{yyMMdd}-{hex4}`.

---

## US-C-04  View My Token & ETA

> **As a citizen, I want to view my active tokens with real-time queue position and estimated wait time so that I can plan my visit accordingly.**

**Jira Ticket:** SCRUM-46
**Epic:** TOKEN BOOKING & QUEUE MGMT
**Priority:** High
**Story Points:** 5
**Status:** Testing
**Sprint branches:** `feature/SCRUM-49-frontend-token-ui`, `feature/SCRUM-50-integrate-token-ui`

### Acceptance Criteria

1. A citizen can view all their tokens (active and past) with: token number, center name, issued date, status, queue position, and ETA.
2. Queue position is computed dynamically: index of the token among `Waiting` tokens ordered by `IssuedTime` for the same center and date.
3. ETA is computed as `baseTime + (queuePosition  averageServiceTimeMinutes)`, capped at center closing time.
4. Token statuses are clearly displayed: `Waiting`, `Serving`, `Completed`, `Cancelled`.
5. The My Queue page (`LiveQueuePage`) shows the current date/time alongside token details.
6. The `GET /api/token/my-tokens` endpoint returns all tokens for the authenticated user.
7. The UI is responsive and works on mobile and desktop viewports.

### Sub-tasks

| Ticket | Description | Branch | Status |
|--------|-------------|--------|--------|
| SCRUM-49 | Frontend token UI (My Queue page with status and ETA) | `feature/SCRUM-49-frontend-token-ui` | Done |
| SCRUM-50 | Integrate token UI with live data from API | `feature/SCRUM-50-integrate-token-ui` | Done |
| SCRUM-52 | Document token viewing feature for end users | *(docs task)* | Done |

### Notes

- `GET /api/token/my-tokens` currently returns a **raw array** (not `ApiResponse<T>`)  logged as BUG-01, fix scheduled for Sprint 2.
- SignalR real-time push updates are deferred to Sprint 2; ETA is static per page load.

---

## US-C-05  Cancel My Booking

> **As a citizen, I want to cancel a booking I no longer need, so that my slot is freed for others and the queue remains accurate.**

**Jira Ticket:** SCRUM-53
**Epic:** TOKEN BOOKING & QUEUE MGMT
**Priority:** High
**Story Points:** 3
**Status:** Testing
**Sprint branches:** `feature/SCRUM-55`, `feature/SCRUM-56`, `feature/SCRUM-57`, `feature/SCRUM-58`, `feature/SCRUM-63`

### Acceptance Criteria

1. Only `Waiting` tokens can be cancelled. Attempting to cancel a `Serving`, `Completed`, or already-`Cancelled` token returns an appropriate result code.
2. Cancellation updates token status to `Cancelled` and sets `cancelled_at`.
3. After cancellation, downstream `Waiting` tokens in the same center+date queue have their positions shifted atomically.
4. Admin users can cancel any token (ownership check bypassed by role).
5. The cancellation UI shows a confirmation dialog before submitting.
6. Error codes returned: `AlreadyCancelled`, `NotCancellable`, `TokenNotFound`, `Success`.

### Sub-tasks

| Ticket | Description | Branch | Status |
|--------|-------------|--------|--------|
| SCRUM-54 | Design token cancellation API contract | *(docs task)* | Done |
| SCRUM-55 | Implement token cancellation backend (service, state machine, stored proc integration) | `feature/SCRUM-55-token-cancellation-backend` | Done |
| SCRUM-56 | Update database schema for cancellations (`cancelled_at` column) | `feature/SCRUM-56-update-database-schema-cancellations` | Done |
| SCRUM-57 | Token cancellation UI (cancel button, confirmation dialog) | `feature/SCRUM-57-token-cancellation-ui` | Done |
| SCRUM-58 | Token cancellation API integration (frontend  backend) | `feature/SCRUM-58-token-cancellation-api-integration` | Done |
| SCRUM-60 | Document token cancellation process for end users | *(docs task)* | Done |
| SCRUM-63 | Cancellation error handling (result code mapping to UI messages) | `feature/SCRUM-63-cancellation-error-handling` | Done |

### Notes

- Cancellation calls the atomic stored procedure `CancelAndShiftQueueAsync` to ensure queue consistency.

---

## US-A-01  Create & View Service Centers (Admin)

> **As an admin, I want to create and manage service centers, including their location and operating schedule, so that citizens always see accurate and up-to-date center information.**

**Jira Ticket:** SCRUM-64
**Epic:** ADMIN SERVICE CENTER MGMT
**Priority:** Medium
**Story Points:** 3
**Status:** Testing
**Sprint branches:** `feature/SCRUM-65`, `feature/SCRUM-66`, `feature/SCRUM-67`, `feature/SCRUM-68`, `feature/SCRUM-69`, `feature/SCRUM-72`, `feature/SCRUM-74`

### Acceptance Criteria

1. An authenticated admin can create a new service center with: name (2100 chars), address (5255 chars), timezone (IANA), opening/closing time (HH:mm), capacity (110000), average service time (1480 min).
2. Creating a center automatically seeds a default MondayFriday open schedule.
3. Admin can optionally attach a location record (street address, city, district, province, lat/lon, Google Maps URL, landmark) at creation time or later via `PUT /{id}/location`.
4. Latitude and longitude must be supplied together (one without the other is rejected).
5. Duplicate center names return `DUPLICATE_SERVICE_CENTER` (409).
6. Citizens can view center location details via `GET /api/service-centers/{id}/location`.
7. The admin create center form validates all fields client-side before submission.
8. All service center API errors use the standardized `ErrorResponse` format.

### Sub-tasks

| Ticket | Description | Branch | Status |
|--------|-------------|--------|--------|
| SCRUM-65 | Service center creation & retrieval backend (controller + service + repository) | `feature/SCRUM-65-service-center-creation-retrieval` | Done |
| SCRUM-66 | Service center listing  citizen UI improvements | `feature/SCRUM-66-service-center-citizen-ui` | Done |
| SCRUM-67 | Admin create service center UI (`AdminCreateServiceCenterPage`) | `feature/SCRUM-67-admin-create-service-center-ui` | Done |
| SCRUM-68 | Frontend service center API integration (admin flow) | `feature/SCRUM-68-frontend-service-center-api-integration` | Done |
| SCRUM-69 | Service center creation validation (annotation-level + service-level) | `feature/SCRUM-69-service-center-creation-validation` | Done |
| SCRUM-71 | Document service center management features | *(docs task)* | Done |
| SCRUM-72 | Service center location schema (`center_locations` table, `CenterLocationDto`) | `feature/SCRUM-72-service-center-location-schema` | Done |
| SCRUM-74 | Service center API error handling (all error codes and middleware integration) | `feature/SCRUM-74-service-center-api-error-handling` | Done |

---

## US-A-02  View & Delete Users (Admin)

> **As an admin, I want to view, filter, and remove users so that I can maintain system security and ensure only authorised users have access.**

**Jira Ticket:** SCRUM-75
**Epic:** ADMIN USER MANAGEMENT
**Priority:** Medium
**Story Points:** 3
**Status:** Testing
**Sprint branches:** `feature/SCRUM-76`, `feature/SCRUM-77`, `feature/SCRUM-78`, `feature/SCRUM-79`, `feature/SCRUM-83`

### Acceptance Criteria

1. An admin can view all registered users with fields: username, email, role, center ID, active status, email verified, deleted status, created date, last login.
2. Admin can filter the user list by `role` (citizen, officer, admin) and `isActive` (true/false).
3. Invalid role filter values return `INVALID_ROLE_FILTER` (400).
4. Admin can soft-delete a non-admin user  sets `deleted_at`, `deleted_by`, writes an audit log entry.
5. Attempting to delete an admin account returns `CANNOT_DELETE_ADMIN` (403).
6. Attempting to delete an already-deleted user returns `USER_NOT_FOUND` (404).
7. Invalid user ID ( 0) returns `INVALID_USER_ID` (400).
8. The delete action shows a confirmation dialog before submitting.
9. Admin accounts cannot be deleted  enforced at the service layer.
10. All user management API errors use the standardized `ErrorResponse` format.

### Sub-tasks

| Ticket | Description | Branch | Status |
|--------|-------------|--------|--------|
| SCRUM-76 | User management database schema (`user_audit_log` table, soft-delete columns) | `feature/SCRUM-76-user-management-schema` | Done |
| SCRUM-77 | Admin user management UI (`AdminUsersPage` with role/status badges, filters) | `feature/SCRUM-77-admin-user-management-ui` | Done |
| SCRUM-78 | Integrate frontend user management APIs (`AdminUserController`, `UserManagementService`, `AdminUserDto`) | `feature/SCRUM-78-integrate-frontend-user-management-apis` | Done |
| SCRUM-79 | User deletion confirmation prompt (mobile and desktop variants, `data-testid`) | `feature/SCRUM-79-user-deletion-confirmation-prompt` | Done |
| SCRUM-81 | Document user management features for Admins | *(docs task)* | Done |
| SCRUM-83 | User management API error handling (all exception types and codes) | `feature/SCRUM-83-user-management-api-error-handling` | Done |

### Notes

- Soft-delete audit note: "Soft-deleted by admin via Admin Users panel (SCRUM-78)".
- `IsDeleted` is a computed property: `DeletedAt.HasValue`.
- Deleted users are excluded from active user counts but remain in the database for audit purposes.

---

## US-D-01  CI Pipeline

> **As a developer, I want a fully configured CI pipeline so that every pull request is automatically built and tested before merging.**

**Jira Ticket:** SCRUM-84
**Epic:** CI/CD & DEVOPS INFRASTRUCTURE
**Priority:** Medium
**Story Points:** 5
**Status:** Idea
**Sprint branches:** documented via SCRUM-88

### Acceptance Criteria

1. GitHub Actions CI runs on every PR targeting `main`: restore  build  unit test  coverage upload  frontend build.
2. PRs cannot be merged if any CI step fails.
3. CI pipeline is configured via `.github/workflows/ci.yml`.
4. Coverage reports are uploaded as artifacts.
5. The pipeline correctly handles both backend (dotnet) and frontend (Vite/Node) build steps.

### Sub-tasks

| Ticket | Description | Branch | Status |
|--------|-------------|--------|--------|
| SCRUM-88 | Document CI pipeline setup, workflow file, and merge rules | *(docs task)* | Done |

---

## US-D-02  Docker & Docker Compose

> **As a developer, I want a containerized local development environment so that the full stack can be run consistently on any machine without manual setup.**

**Jira Ticket:** SCRUM-89
**Epic:** CI/CD & DEVOPS INFRASTRUCTURE
**Priority:** Medium
**Story Points:** 3
**Status:** Idea
**Sprint branches:** documented via SCRUM-93

### Acceptance Criteria

1. `docker-compose up --build` starts all four services: `backend`, `frontend`, `mysql:8.0`, `redis:7-alpine`.
2. Backend is accessible at `http://localhost:5000`, frontend at `http://localhost:5173`.
3. Database migrations can be applied with `node scripts/migrate.js`.
4. `node scripts/health_check.js` validates all key API endpoints and returns pass/fail per endpoint.
5. Environment variables are documented in `devops-doc.md`.

### Sub-tasks

| Ticket | Description | Branch | Status |
|--------|-------------|--------|--------|
| SCRUM-93 | Document Docker and Docker Compose setup (images, ports, env vars, run instructions) | *(docs task)* | Done |

---

## US-D-03  Staging / Demo Deployment

> **As a DevOps engineer, I want the full application deployed to a staging environment so that the demo audience can access it without running the stack locally.**

**Jira Ticket:** SCRUM-94
**Epic:** CI/CD & DEVOPS INFRASTRUCTURE
**Priority:** Low
**Story Points:** 2
**Status:** Idea
**Sprint branches:** documented via SCRUM-98

### Acceptance Criteria

1. A staging environment on Azure App Service is accessible to the demo audience.
2. Deployment instructions are documented and reproducible.
3. The staging URL and access credentials are communicated to the module lecturer before demo day.

### Sub-tasks

| Ticket | Description | Branch | Status |
|--------|-------------|--------|--------|
| SCRUM-98 | Document demo environment setup and access instructions | *(docs task)* | Done |

---

## Deferred Stories

| ID | Jira Ticket | Title | SP | Deferred To | Reason |
|----|-------------|-------|----|-------------|--------|
|  | SCRUM-32 | Email Verification (send email on register) | 3 | Sprint 2 | Token generation & endpoint done; SMTP integration deferred. `SendVerificationEmail` call commented out in `AuthService.RegisterAsync`. Users auto-verified until Sprint 2. |
|  | SCRUM-33 | Password Reset | 1 | Sprint 4 | Scaffolded only (`feature/SCRUM-33-password-reset`). No business priority in Sprint 1. |

---

## Appendix: Branch-to-Story Mapping

| Branch Pattern | User Story | Epic |
|---------------|-----------|------|
| `feature/SCRUM-13`, `15`, `16`, `17`, `29` | US-C-01 | User Authentication |
| `feature/SCRUM-23`, `24`, `25`, `34`, `35` | US-C-02 | Citizen Service Center |
| `feature/SCRUM-36`, `38`, `39`, `40`, `47`, `48` | US-C-03 | Token Booking |
| `feature/SCRUM-49`, `50` | US-C-04 | Token Viewing & ETA |
| `feature/SCRUM-55`, `56`, `57`, `58`, `63` | US-C-05 | Token Cancellation |
| `feature/SCRUM-65`, `66`, `67`, `68`, `69`, `72`, `74` | US-A-01 | Admin Service Centers |
| `feature/SCRUM-76`, `77`, `78`, `79`, `83` | US-A-02 | Admin User Management |
| `SCRUM-88` | US-D-01 | CI Pipeline |
| `SCRUM-93` | US-D-02 | Docker & Compose |
| `SCRUM-98` | US-D-03 | Staging Deployment |
| `feature/SCRUM-32` | Deferred | Email Verification |
| `feature/SCRUM-33` | Deferred | Password Reset |

---
