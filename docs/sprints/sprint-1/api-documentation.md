# Sprint 1 — API Documentation

**Project:** QueueLanka Pro  
**Base URL:** `http://localhost:5000/api`  
**Auth scheme:** `Authorization: Bearer <jwt>`  
**Content-Type:** `application/json`

> All successful responses are wrapped in `ApiResponse<T>`.  
> All error responses use `ErrorResponse`.  
> See [Response Envelope](#response-envelope) at the bottom for schemas.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Service Centers](#2-service-centers)
3. [Appointments](#3-appointments)
4. [Tokens](#4-tokens)
5. [Counters](#5-counters)
6. [Admin — User Management](#6-admin--user-management)
7. [Response Envelope](#7-response-envelope)

---

## 1. Authentication

Base route: `/api/auth`  
No JWT required unless noted.

---

### POST `/api/auth/register`

Register a new user account.

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `username` | string | ✅ | 3–50 chars, `^[a-zA-Z0-9_]+$` |
| `password` | string | ✅ | 8–100 chars, must contain uppercase, lowercase, digit, and special character |
| `email` | string | ✅ | Valid email, max 100 chars |
| `role` | string | ✅ | `citizen` \| `officer` \| `admin` |
| `centerId` | int | officer only | Required when `role` = `officer`; ignored otherwise |

**Example request**
```json
{
  "username": "john_doe",
  "password": "Secure@123",
  "email": "john@example.com",
  "role": "citizen"
}
```

**Responses**

| Code | Description | Body |
|---|---|---|
| `201 Created` | User created | `RegisterResponseDto` |
| `400 Bad Request` | Validation error | `ErrorResponse` with `validationErrors` |
| `409 Conflict` | Username or email already taken | `ErrorResponse` (`DUPLICATE_USERNAME` / `DUPLICATE_EMAIL`) |
| `422 Unprocessable Entity` | Invalid role or officer missing `centerId` | `ErrorResponse` (`INVALID_ROLE` / `CENTER_REQUIRED`) |

**201 response body**
```json
{
  "success": true,
  "data": {
    "userId": 42,
    "username": "john_doe",
    "role": "citizen"
  },
  "message": null
}
```

---

### POST `/api/auth/login`

Authenticate and receive a JWT access token.

**Request body**

| Field | Type | Required |
|---|---|---|
| `username` | string | ✅ |
| `password` | string | ✅ |

**Example request**
```json
{
  "username": "john_doe",
  "password": "Secure@123"
}
```

**Responses**

| Code | Description | Body |
|---|---|---|
| `200 OK` | Login successful | `LoginResponseDto` |
| `400 Bad Request` | Validation error | `ErrorResponse` |
| `401 Unauthorized` | Wrong credentials | `ErrorResponse` (`INVALID_CREDENTIALS`) |
| `403 Forbidden` | Account is deactivated | `ErrorResponse` (`ACCOUNT_DISABLED`) |

**200 response body**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "d5f6a8b2c4...",
    "expiresIn": 3600,
    "role": "citizen"
  }
}
```

> Use `token` as `Authorization: Bearer <token>` on all subsequent requests.

---

### GET `/api/auth/verify-email?token={token}`

Verify a user's email address using the token from the verification email.

**Query parameter**

| Param | Type | Required |
|---|---|---|
| `token` | string | ✅ |

**Responses**

| Code | Description | Body |
|---|---|---|
| `200 OK` | Email verified | `{ "message": "Your email has been verified. You can now log in." }` |
| `400 Bad Request` | Token missing, invalid, expired, or already used | `ErrorResponse` (`TOKEN_MISSING` / `INVALID_VERIFICATION_TOKEN`) |

---

## 2. Service Centers

Base route: `/api/service-centers`  
No authentication required for read endpoints.

---

### GET `/api/service-centers`

Return all service centers with availability information.

**No parameters.**

**Responses**

| Code | Description |
|---|---|
| `200 OK` | List of centers |
| `500 Internal Server Error` | Server error |

**200 response body**
```json
{
  "success": true,
  "data": [
    {
      "centerId": 1,
      "name": "Colombo RMV",
      "address": "123 Main St, Colombo 01",
      "phone": "+94112345678",
      "email": "colombo@rmv.gov.lk",
      "description": "Main RMV office",
      "timezone": "Asia/Colombo",
      "capacity": 50,
      "averageServiceTimeMinutes": 15,
      "openingTime": "08:00",
      "closingTime": "16:30",
      "isAvailable": true,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "location": {
        "locationId": 1,
        "streetAddress": "123 Main Street",
        "city": "Colombo",
        "district": "Colombo",
        "province": "Western Province",
        "postalCode": "00100",
        "country": "Sri Lanka",
        "latitude": 6.9271,
        "longitude": 79.8612,
        "googleMapsUrl": "https://maps.google.com/?q=...",
        "landmark": "Opposite Fort Railway Station"
      }
    }
  ],
  "metadata": {
    "timestamp": "2026-03-02T10:00:00Z",
    "totalCount": 5,
    "correlationId": "abc-123"
  },
  "message": "Retrieved 5 service center(s)"
}
```

---

### GET `/api/service-centers/{id}`

Return a single service center by ID.

**Path parameter**

| Param | Type | Rules |
|---|---|---|
| `id` | int | Must be > 0 |

**Responses**

| Code | Description |
|---|---|
| `200 OK` | Center found — `ApiResponse<ServiceCenterDto>` |
| `400 Bad Request` | `id` ≤ 0 |
| `404 Not Found` | Center not found |
| `500 Internal Server Error` | Server error |

---

### GET `/api/service-centers/{id}/availability`

Check whether a service center is currently available.

**Path parameter:** `id` (int, > 0)

**Responses**

| Code | Description | Body |
|---|---|---|
| `200 OK` | Status returned | `ApiResponse<bool>` — `data: true/false` |
| `400 Bad Request` | Invalid `id` | `ErrorResponse` |
| `404 Not Found` | Center not found | `ErrorResponse` |

**200 response body**
```json
{
  "success": true,
  "data": true,
  "metadata": { "correlationId": "abc-123" },
  "message": "Service center is currently available"
}
```

> `isAvailable` is `true` only when both `center.IsActive` AND today's availability schedule are active.

---

### GET `/api/service-centers/{id}/location`

Return the structured location record for a service center.

**Path parameter:** `id` (int, > 0)

**Responses**

| Code | Description |
|---|---|
| `200 OK` | `ApiResponse<CenterLocationDto>` |
| `400 Bad Request` | Invalid `id` |
| `404 Not Found` | Center or location not found |
| `500 Internal Server Error` | Server error |

---

### POST `/api/service-centers` 🔒 Admin

Create a new service center. Automatically seeds a default Mon–Fri operating schedule using the supplied opening/closing times. Sat and Sun default to closed.

**Auth:** `Bearer token` with role `admin`

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | ✅ | 2–100 chars |
| `address` | string | ✅ | 5–255 chars |
| `phone` | string | — | Valid phone, max 20 chars |
| `email` | string | — | Valid email, max 100 chars |
| `description` | string | — | Max 1000 chars |
| `timezone` | string | ✅ | IANA timezone, e.g. `Asia/Colombo` |
| `capacity` | int | — | 1–10000, default `50` |
| `averageServiceTimeMinutes` | int | — | 1–480, default `15` |
| `openingTime` | string | ✅ | `HH:mm` format, e.g. `08:00` |
| `closingTime` | string | ✅ | `HH:mm` format, e.g. `17:00` |
| `isActive` | bool | — | Default `true` |
| `streetAddress` | string | — | Max 255 chars |
| `city` | string | — | Max 100 chars |
| `district` | string | — | Max 100 chars |
| `province` | string | — | Max 100 chars |
| `postalCode` | string | — | Max 20 chars |
| `country` | string | — | Max 100 chars, default `Sri Lanka` |
| `latitude` | decimal | — | −90 to +90, must be paired with `longitude` |
| `longitude` | decimal | — | −180 to +180, must be paired with `latitude` |
| `googleMapsUrl` | string | — | Valid URL, max 500 chars |
| `landmark` | string | — | Max 255 chars |

**Responses**

| Code | Description |
|---|---|
| `201 Created` | `ApiResponse<ServiceCenterDto>` |
| `400 Bad Request` | Validation error |
| `401 Unauthorized` | No/invalid token |
| `403 Forbidden` | Not admin |
| `409 Conflict` | Duplicate name + address |
| `500 Internal Server Error` | Server error |

---

### PUT `/api/service-centers/{id}/location` 🔒 Admin

Create or update the structured location record for a center. `latitude` and `longitude` must be provided together or not at all.

**Auth:** `Bearer token` with role `admin`

**Responses**

| Code | Description |
|---|---|
| `200 OK` | `ApiResponse<CenterLocationDto>` |
| `400 Bad Request` | Validation error or mismatched coordinate pair |
| `401 Unauthorized` | No/invalid token |
| `403 Forbidden` | Not admin |
| `404 Not Found` | Center not found |
| `500 Internal Server Error` | Server error |

---

## 3. Appointments

Base route: `/api/appointment`  
**Auth required** on all endpoints (`Bearer token`).

---

### POST `/api/appointment/book`

Book a new appointment (token) at a service center.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `centerId` | int | ✅ | ID of the target service center |
| `appointmentDate` | DateTime | ✅ | Date of the appointment (ISO 8601) |
| `appointmentTime` | TimeSpan | ✅ | Time of the appointment (e.g. `"09:30:00"`) |

**Example request**
```json
{
  "centerId": 1,
  "appointmentDate": "2026-03-15T00:00:00Z",
  "appointmentTime": "09:30:00"
}
```

**Responses**

| Code | Description | Body |
|---|---|---|
| `200 OK` | Booking successful | `ApiResponse<AppointmentResponseDto>` |
| `400 Bad Request` | Validation error | `ErrorResponse` |
| `401 Unauthorized` | Invalid/missing token | `ErrorResponse` (`INVALID_TOKEN`) |
| `404 Not Found` | Center or resource not found | `ErrorResponse` (`RESOURCE_NOT_FOUND`) |
| `409 Conflict` | Duplicate booking or center full | `ErrorResponse` (`BOOKING_CONFLICT` / `DUPLICATE_BOOKING` / `CENTER_FULL`) |
| `500 Internal Server Error` | Unexpected error | `ErrorResponse` (`INTERNAL_ERROR`) |

**200 response body**
```json
{
  "success": true,
  "data": {
    "appointmentId": 1024,
    "centerId": 1,
    "userId": 42,
    "tokenId": 501,
    "tokenNumber": "C102",
    "appointmentDate": "2026-03-15T00:00:00Z",
    "appointmentTime": "09:30:00",
    "status": "booked",
    "createdAt": "2026-03-02T10:00:00Z"
  },
  "metadata": { "correlationId": "abc-123" },
  "message": "Token booked successfully."
}
```

---

### GET `/api/appointment/my-bookings`

Return all appointments belonging to the authenticated user.

**No parameters.**

**Responses**

| Code | Description |
|---|---|
| `200 OK` | `ApiResponse<AppointmentResponseDto[]>` |
| `401 Unauthorized` | Invalid/missing token |
| `500 Internal Server Error` | Server error |

---

## 4. Tokens

Base route: `/api/token`  
**Auth required** — roles: `citizen`, `officer`, or `admin`.

---

### GET `/api/token/my-tokens`

Return all tokens issued to the authenticated user.

**No parameters.**

**200 response body**
```json
[
  {
    "tokenId": 501,
    "centerId": 1,
    "centerName": "Colombo RMV",
    "tokenNumber": "C102",
    "issuedDate": "2026-03-15T00:00:00Z",
    "issuedTime": "2026-03-15T09:00:00Z",
    "status": "waiting",
    "estimatedServiceTime": "2026-03-15T09:30:00Z",
    "servedTime": null,
    "completedTime": null,
    "queuePosition": 5,
    "eta": "2026-03-15T09:30:00Z"
  }
]
```

> Note: This endpoint returns the raw array (not wrapped in `ApiResponse`).

**Token status values:** `waiting` | `called` | `serving` | `completed` | `cancelled` | `no_show`

**Responses**

| Code | Description |
|---|---|
| `200 OK` | Array of `UserTokenResponseDto` |
| `401 Unauthorized` | Invalid/missing token |

---

### PUT `/api/token/{tokenId}/cancel`

Cancel a specific token belonging to the authenticated user.

**Path parameter**

| Param | Type | Required |
|---|---|---|
| `tokenId` | int | ✅ |

**Responses**

| Code | Description | Body |
|---|---|---|
| `200 OK` | Cancelled successfully | `{ "message": "Token cancelled successfully." }` |
| `401 Unauthorized` | Invalid/missing token | `{ "code": "INVALID_USER", "message": "..." }` |
| `404 Not Found` | Token not found or doesn't belong to user | `{ "code": "TOKEN_NOT_FOUND", "message": "..." }` |
| `409 Conflict` | Token already cancelled | `{ "code": "TOKEN_ALREADY_CANCELLED", "message": "..." }` |
| `422 Unprocessable Entity` | Token is being served / completed / no-show | `{ "code": "TOKEN_NOT_CANCELLABLE", "message": "..." }` |

> Admins can cancel any token regardless of ownership.

---

## 5. Counters

Base route: `/api/counters`  
**Auth required** — role: `officer` only.

---

### POST `/api/counters/{counterId}/call-next`

Call the next waiting token at the specified counter in FIFO order. Updates the token status to 'called' and broadcasts real-time updates to all connected clients.

**Path parameter**

| Param | Type | Required | Rules |
|---|---|---|---|
| `counterId` | int | ✅ | Must be > 0, counter must be open |

**Request body:** None (empty body)

**Example request**
```bash
POST /api/counters/5/call-next
Authorization: Bearer <officer-jwt-token>
Content-Type: application/json

{}
```

**Responses**

| Code | Description | Body |
|---|---|---|
| `200 OK` | Token successfully called | `ApiResponse<CallNextTokenResponseDto>` |
| `400 Bad Request` | Counter is closed or invalid | `ErrorResponse` (`COUNTER_CLOSED`) |
| `401 Unauthorized` | Missing/invalid token | `ErrorResponse` |
| `403 Forbidden` | Not an officer | `ErrorResponse` |
| `404 Not Found` | No waiting tokens available | `ErrorResponse` (`NO_WAITING_TOKENS`) |
| `500 Internal Server Error` | Server error | `ErrorResponse` |

**200 response body**
```json
{
  "success": true,
  "data": {
    "tokenId": 123,
    "centerId": 1,
    "counterId": 5,
    "userId": 456,
    "tokenNumber": "A001",
    "issuedDate": "2026-03-15",
    "status": "called",
    "issuedTime": "2026-03-15T10:30:00Z",
    "calledAt": "2026-03-15T11:45:00Z"
  },
  "metadata": {
    "timestamp": "2026-03-15T11:45:00Z",
    "correlationId": "abc-123"
  },
  "message": "Token A001 has been called successfully."
}
```

**Error response examples**

**404 - No waiting tokens:**
```json
{
  "code": "NO_WAITING_TOKENS",
  "message": "There are no waiting tokens for this counter today."
}
```

**400 - Counter closed:**
```json
{
  "code": "COUNTER_CLOSED",
  "message": "Counter is closed or does not exist."
}
```

> **Real-time updates:** This endpoint triggers `QueueUpdated` events via SignalR to all clients connected to the counter's group, providing live queue state updates including waiting counts, served counts, and estimated wait times.

> **Atomic operation:** The token selection and status update is performed atomically to prevent race conditions when multiple officers attempt to call tokens simultaneously.

---

## 6. Admin — User Management

Base route: `/api/admin/users`  
**Auth required** — role: `admin` only.

---

### GET `/api/admin/users`

List all non-deleted users with optional filters.

**Query parameters (all optional)**

| Param | Type | Values |
|---|---|---|
| `role` | string | `citizen` \| `officer` \| `admin` |
| `isActive` | bool | `true` \| `false` |

**Example**
```
GET /api/admin/users?role=officer&isActive=true
```

**Responses**

| Code | Description |
|---|---|
| `200 OK` | `ApiResponse<AdminUserDto[]>` |
| `400 Bad Request` | Invalid `role` filter value |
| `401 Unauthorized` | No/invalid token |
| `403 Forbidden` | Not admin |
| `500 Internal Server Error` | Server error |

**200 response body**
```json
{
  "success": true,
  "data": [
    {
      "userId": 42,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "citizen",
      "centerId": null,
      "isActive": true,
      "isEmailVerified": false,
      "isDeleted": false,
      "createdAt": "2026-02-01T00:00:00Z",
      "updatedAt": null,
      "lastLoginAt": "2026-03-01T10:00:00Z"
    }
  ],
  "metadata": {
    "totalCount": 1,
    "correlationId": "abc-123"
  },
  "message": "Retrieved 1 user(s)"
}
```

---

### DELETE `/api/admin/users/{id}`

Soft-delete a user account. Cannot delete another admin account.

**Path parameter**

| Param | Type | Rules |
|---|---|---|
| `id` | int | Must be > 0 |

**Responses**

| Code | Description |
|---|---|
| `200 OK` | `ApiResponse<null>` — `"User {id} has been deleted successfully"` |
| `400 Bad Request` | `id` ≤ 0 |
| `401 Unauthorized` | No/invalid token |
| `403 Forbidden` | Not admin, or attempting to delete an admin |
| `404 Not Found` | User not found or already deleted |
| `500 Internal Server Error` | Server error |

---

## 7. Response Envelope

### Success — `ApiResponse<T>`

```json
{
  "success": true,
  "data": { },
  "metadata": {
    "timestamp": "2026-03-02T10:00:00Z",
    "totalCount": 5,
    "page": null,
    "pageSize": null,
    "correlationId": "abc-123"
  },
  "message": "Human-readable message"
}
```

### Error — `ErrorResponse`

```json
{
  "success": false,
  "code": "MACHINE_READABLE_CODE",
  "message": "Human-readable error message",
  "details": null,
  "validationErrors": [
    {
      "field": "password",
      "message": "Password must contain uppercase, lowercase, a digit, and a special character.",
      "rejectedValue": "weak"
    }
  ],
  "timestamp": "2026-03-02T10:00:00Z",
  "path": "/api/auth/register",
  "correlationId": "abc-123"
}
```

### Common error codes

| Code | HTTP | Meaning |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Wrong username or password |
| `ACCOUNT_DISABLED` | 403 | Account deactivated by admin |
| `DUPLICATE_USERNAME` | 409 | Username already taken |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `INVALID_ROLE` | 422 | Role is not `citizen`, `officer`, or `admin` |
| `CENTER_REQUIRED` | 422 | Officer must supply `centerId` |
| `TOKEN_MISSING` | 400 | Email verification token not provided |
| `INVALID_VERIFICATION_TOKEN` | 400 | Verification token invalid/expired |
| `INVALID_TOKEN` | 401 | JWT claim missing or malformed |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `BOOKING_CONFLICT` | 409 | Duplicate booking or slot conflict |
| `TOKEN_ALREADY_CANCELLED` | 409 | Token was already cancelled |
| `TOKEN_NOT_CANCELLABLE` | 422 | Token status prevents cancellation |
| `TOKEN_NOT_FOUND` | 404 | Token not found or not owned by user |
| `INVALID_USER_ROLE_FILTER` | 400 | Admin role filter value is not valid |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
