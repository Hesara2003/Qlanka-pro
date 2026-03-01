# Sprint 1 — SCRUM Items Documentation

> QueueLanka Pro | SE3022 Case Study Project | Semester 1, 2026
> Released: 14 Feb 2026 | Submission: 27 Apr 2026

This document consolidates all documentation artifacts created during Sprint 1. Each section corresponds to a specific SCRUM task, detailing API designs, user flows, feature documentation, and infrastructure setup.

---

## Table of Contents

1. [SCRUM-13: Registration & Login API Endpoints](#scrum-13)
2. [SCRUM-19: Registration & Login Flow — End Users](#scrum-19)
3. [SCRUM-27: Service Centre Viewing — End Users](#scrum-27)
4. [SCRUM-30: Service Centre Listing API Contract](#scrum-30)
5. [SCRUM-34: Accessibility Review — Service Centre Listing UI](#scrum-34)
6. [SCRUM-37: Token Booking API Contract](#scrum-37)
7. [SCRUM-44: Token Booking Process — End Users](#scrum-44)
8. [SCRUM-52: Token Viewing Feature — End Users](#scrum-52)
9. [SCRUM-54: Token Cancellation API Contract](#scrum-54)
10. [SCRUM-60: Token Cancellation Process — End Users](#scrum-60)
11. [SCRUM-71: Service Centre Management — Admins & Citizens](#scrum-71)
12. [SCRUM-81: User Management — Admins](#scrum-81)
13. [SCRUM-88: CI Pipeline Setup & Usage](#scrum-88)
14. [SCRUM-93: Docker & Docker Compose Setup](#scrum-93)
15. [SCRUM-98: Demo Environment Setup & Access](#scrum-98)

---

<a name="scrum-13"></a>
## SCRUM-13: Design Registration & Login API Endpoints

### Overview

Authentication is handled via JWT tokens issued by the backend after successful login. Two endpoints are provided: registration and login.

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user (citizen or officer) |
| POST | `/api/auth/login` | Authenticate user and return JWT token |

### Registration — Request / Response

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123",
  "email": "john@example.com",
  "role": "citizen",
  "centerId": 1
}
```
> `centerId` is optional — required for officers only.
> `role` accepts: `"citizen"`, `"officer"`, or `"admin"`.

**Response (201 Created):**
```json
{
  "userId": 42,
  "username": "john_doe",
  "role": "citizen"
}
```

### Login — Request / Response

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "refreshToken": "d5f6...",
  "expiresIn": 3600,
  "role": "citizen"
}
```

> All subsequent API calls must include the JWT in the `Authorization: Bearer <token>` header.

---

<a name="scrum-19"></a>
## SCRUM-19: Document Registration & Login Flow for End Users

### User Registration Flow

1. User navigates to the registration page (`/register`).
2. Fills in username, password, email, and selects role (citizen/officer). Officers must also select a service centre.
3. Submits the form.
4. System validates input (username unique, password strength).
5. On success, user is redirected to login page with a success message.
6. On error, appropriate error message is displayed.

### User Login Flow

1. User navigates to login page (`/login`).
2. Enters username and password.
3. Submits form.
4. System authenticates credentials.
5. On success, JWT token is stored in browser (`localStorage`/`sessionStorage`) and user is redirected to role-appropriate dashboard:
   - Citizen → booking page
   - Officer → counter dashboard
   - Admin → admin panel
6. On failure, error message "Invalid username or password" is shown.

### Password Reset

Password reset functionality is planned for **Sprint 4**.

---

<a name="scrum-27"></a>
## SCRUM-27: Document Service Centre Viewing Feature for End Users

### Feature Description

Citizens can browse a list of available service centres (e.g., RMV offices, hospitals) to select one before booking an appointment.

### User Interface

- The home page displays a searchable/filterable list of centres.
- Each entry shows: centre name, address, operating hours, current queue load (if available), and a "Select" button.
- Clicking "Select" navigates to the booking page for that centre.

### Data Displayed

- Centre name
- Full address
- Timezone (e.g., `"Asia/Colombo"`)
- Operating hours (e.g., "Mon-Fri 8:00–16:30, Sat 8:00–12:00")
- Estimated wait time (if queue data available)

### UI Mockup

```
-------------------------------------------
| Centre Name: Colombo RMV
| Address: 123 Main St, Colombo 01
| Hours: Mon-Fri 8:00-16:30, Sat 8:00-12:00
| Current wait: ~15 mins
| [Select]
-------------------------------------------
| Centre Name: Kandy General Hospital
| Address: 45 Peradeniya Rd, Kandy
| Hours: 24/7
| Current wait: ~45 mins
| [Select]
-------------------------------------------
```

---

<a name="scrum-30"></a>
## SCRUM-30: Design API Contract for Service Centre Listing

### Endpoint

```
GET /api/centers
```

### Description

Returns a list of all service centres. Supports optional filtering and sorting.

### Query Parameters (optional)

| Parameter | Type | Description |
|---|---|---|
| `name` | string | Filter by centre name (partial match) |
| `city` | string | Filter by city (exact match) |
| `sortBy` | string | Sort field: `name` or `createdAt` |
| `order` | string | `asc` or `desc` (default: `asc`) |

### Response (200 OK)

```json
[
  {
    "centerId": 1,
    "name": "Colombo RMV",
    "address": "123 Main St, Colombo 01",
    "timezone": "Asia/Colombo",
    "operatingHours": {
      "monday": "08:00-16:30",
      "tuesday": "08:00-16:30",
      "wednesday": "08:00-16:30",
      "thursday": "08:00-16:30",
      "friday": "08:00-16:30",
      "saturday": "08:00-12:00",
      "sunday": "closed"
    },
    "capacity": 50,
    "currentQueueLoad": 12,
    "estimatedWaitTime": 15
  }
]
```

### Error Responses

| Code | Reason |
|---|---|
| 401 | Unauthorized — missing/invalid token |
| 500 | Internal Server Error |

---

<a name="scrum-34"></a>
## SCRUM-34: Accessibility Review — Service Centre Listing UI

### Review Summary

An accessibility review was performed on the service centre listing UI using **WCAG 2.1 AA** guidelines.

### Findings & Recommendations

| Issue | Impact | Recommendation |
|---|---|---|
| Low contrast between text and background (grey on white) | Hard to read for visually impaired | Increase contrast ratio to at least 4.5:1 |
| No keyboard navigation for centre cards | Users relying on keyboard cannot select centres | Add `tabindex` and keyboard event handlers |
| Missing alt text for icons | Screen readers skip meaning | Add descriptive alt text to all icons |
| Heading hierarchy skips from H1 to H3 | Confusing for screen reader users | Ensure headings follow logical order (H1, H2, H3) |

### Actions Taken

- Adjusted CSS to meet contrast ratios.
- Implemented proper focus management and ARIA labels.
- Added skip links and landmark roles.

---

<a name="scrum-37"></a>
## SCRUM-37: Design Token Booking API Contract

### Endpoint

```
POST /api/centers/{centerId}/appointments
```

### Description

Creates a new appointment (token) for a citizen at a specific centre and time slot.

### Path Parameters

| Parameter | Description |
|---|---|
| `centerId` | ID of the service centre |

### Request Body

```json
{
  "scheduledTime": "2026-03-15T09:30:00Z",
  "remarks": "Need wheelchair assistance"
}
```
> `remarks` is optional.

### Response (201 Created)

```json
{
  "appointmentId": 1024,
  "tokenNumber": "C102",
  "centerId": 1,
  "centerName": "Colombo RMV",
  "scheduledTime": "2026-03-15T09:30:00Z",
  "status": "booked",
  "queuePosition": 5,
  "estimatedWaitTime": 25,
  "createdAt": "2026-02-18T10:15:00Z"
}
```

### Error Responses

| Code | Reason |
|---|---|
| 400 | Bad Request — invalid time slot or centre closed |
| 401 | Unauthorized — missing/invalid token |
| 409 | Conflict — duplicate booking for same time |

---

<a name="scrum-44"></a>
## SCRUM-44: Document Token Booking Process for End Users

### Step-by-Step Booking Process

1. After logging in, citizen lands on the home page showing list of centres.
2. Clicks "Select" on a desired centre.
3. Calendar view appears with available time slots (based on centre capacity).
4. Citizen picks a date and time slot.
5. Optionally adds remarks (e.g., accessibility needs).
6. Clicks "Confirm Booking".
7. System validates and creates appointment.
8. Success page displays token number, queue position, and ETA.
9. A confirmation email/SMS (future sprint) is sent.

### Screens

| Screen | Description |
|---|---|
| Centre Selection | List of centres with details |
| Time Slot Picker | Calendar grid showing available (green) and booked (grey) slots |
| Booking Confirmation | Token number, queue position, and buttons: "View My Queue" / "Book Another" |

---

<a name="scrum-52"></a>
## SCRUM-52: Document Token Viewing Feature for End Users

### Feature Description

Citizens can view their active tokens and queue status from a dedicated **"My Queue"** page.

### Information Displayed

| Field | Description |
|---|---|
| Token number | Unique identifier (e.g., `C102`) |
| Centre name | Name of the service centre |
| Scheduled time | Booked appointment time |
| Queue position | Current position in the queue |
| Estimated wait time | Dynamic, updates in real time |
| Status | `Waiting`, `Called`, `Served`, or `Cancelled` |
| Actions | "Cancel" (if within window), "View Details" |

### Real-time Updates

The page uses **SignalR** to push updates when queue position changes or when the token is called.

### UI Mockup

```
+--------------------------------------------------+
| My Queue                                         |
+--------------------------------------------------+
| Token: C102       | Centre: Colombo RMV          |
| Scheduled: 2026-03-15 09:30                      |
| Position: 5       | Est. wait: 25 mins           |
| Status: Waiting                                  |
| [Cancel]  [View Details]                         |
+--------------------------------------------------+
```

---

<a name="scrum-54"></a>
## SCRUM-54: Design Token Cancellation API Contract

### Endpoint

```
PUT /api/appointments/{appointmentId}/cancel
```

### Description

Cancels an existing appointment. Only allowed if cancellation is within the permitted window (at least **2 hours** before scheduled time).

### Path Parameters

| Parameter | Description |
|---|---|
| `appointmentId` | ID of the appointment to cancel |

### Request Body

```json
{
  "reason": "Change of plans"
}
```
> `reason` is optional.

### Response (200 OK)

```json
{
  "appointmentId": 1024,
  "status": "cancelled",
  "cancelledAt": "2026-03-14T14:30:00Z"
}
```

### Error Responses

| Code | Reason |
|---|---|
| 400 | Bad Request — cancellation not allowed (too late) |
| 401 | Unauthorized — invalid token or not the owner |
| 404 | Not Found — appointment does not exist |

---

<a name="scrum-60"></a>
## SCRUM-60: Document Token Cancellation Process for End Users

### Cancellation Flow

1. Citizen navigates to "My Queue" page.
2. Finds the token they wish to cancel.
3. Clicks "Cancel" button.
4. A confirmation dialog appears: *"Are you sure you want to cancel this appointment? This action cannot be undone."*
5. If confirmed, system sends cancellation request.
6. On success, token status changes to "Cancelled" and queue updates.
7. Citizen receives confirmation message.

### Rules

- Cancellation is allowed up to **2 hours** before scheduled time.
- After that, the "Cancel" button is disabled.
- Cancelled tokens cannot be reactivated.

---

<a name="scrum-71"></a>
## SCRUM-71: Document Service Centre Management — Admins & Citizens

### For Citizens

Citizens can view centre details as described in [SCRUM-27](#scrum-27).

### For Admins

Admins have a dedicated management interface to:

- Add new service centres (name, address, timezone, operating hours, capacity).
- Edit existing centre details.
- Deactivate a centre (soft delete).
- View list of centres with summary statistics (total appointments, average wait time).

### Admin UI Screens

| Screen | Description |
|---|---|
| Centres List | Table with columns: ID, Name, Address, Capacity, Status (active/inactive), Actions (Edit, Deactivate) |
| Add/Edit Centre Form | Fields for all centre attributes |
| Operating Hours Editor | Per-day time pickers |

---

<a name="scrum-81"></a>
## SCRUM-81: Document User Management Features for Admins

### User Roles

| Role | Permissions |
|---|---|
| Citizen | Book, view, and cancel appointments |
| Officer | Work at a centre, manage tokens |
| Admin | Full system configuration |

### Admin Capabilities

- View all users with filtering (by role, centre).
- Create new users (especially officers and admins).
- Edit user details (except password — reset via email).
- Deactivate / activate users.
- Assign officers to centres.

### User Management API (High-Level)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users (paginated) |
| POST | `/api/admin/users` | Create a new user |
| PUT | `/api/admin/users/{id}` | Update user details |
| DELETE | `/api/admin/users/{id}` | Deactivate user |

---

<a name="scrum-88"></a>
## SCRUM-88: Document CI Pipeline Setup & Usage

### Pipeline Overview

The CI pipeline is implemented using **GitHub Actions**. It runs on every pull request targeting `main`.

### Workflow File: `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore --configuration Release

      - name: Run unit tests with coverage
        run: dotnet test --no-build --configuration Release --collect:"XPlat Code Coverage"

      - name: Upload coverage to Coveralls
        uses: coverallsapp/github-action@v2
        with:
          file: coverage.cobertura.xml

      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Run Playwright tests
        run: npx playwright test
```

### Usage

- Developers create feature branches and open PRs.
- CI automatically runs all checks.
- PR cannot be merged if any step fails.
- Coverage reports are visible in PR comments.

---

<a name="scrum-93"></a>
## SCRUM-93: Document Docker & Docker Compose Setup

### Docker Setup

The application is containerized using Docker with two main images:

| Image | Description |
|---|---|
| `backend` | ASP.NET Core API |
| `frontend` | React app served via Nginx |

### `docker-compose.yml`

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: queuelanka
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      - ConnectionStrings__Default=Server=mysql;Database=queuelanka;User=root;Password=rootpass;
      - Redis__ConnectionString=redis:6379
    ports:
      - "5000:8080"
    depends_on:
      - mysql
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

### Usage

1. Install Docker and Docker Compose.
2. Clone the repository.
3. Run `docker-compose up --build` from the root.
4. Access:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

---

<a name="scrum-98"></a>
## SCRUM-98: Document Demo Environment Setup & Access

### Demo Environment

A staging environment is deployed on **Azure App Service** for client demonstrations.

### Access Details

| Resource | URL |
|---|---|
| Frontend | https://queuelanka-demo.azurewebsites.net |
| Backend API | https://queuelanka-api.azurewebsites.net |
| Swagger Docs | https://queuelanka-api.azurewebsites.net/swagger |

### Credentials (Demo Only)

| Role | Username | Password |
|---|---|---|
| Citizen | citizen1@demo.com | Demo123! |
| Officer | officer1@demo.com | Demo123! |
| Admin | admin@demo.com | Demo123! |

### Local Demo Setup

1. Follow Docker Compose instructions ([SCRUM-93](#scrum-93)).
2. Seed database with sample data: `dotnet run seed`.
3. Access locally as described above.

### Notes

- Demo environment resets every 24 hours.
- For any issues, contact the development team.

---

## Revision History

| Date | Author | Changes |
|---|---|---|
| 2026-02-18 | Team | Initial Sprint 1 documentation |
