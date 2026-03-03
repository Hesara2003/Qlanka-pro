# SCRUM-30  Service Center Listing API Contract

## Summary

Full API contract for service center endpoints. Derived from `ServiceCenterController.cs`, `ServiceCenterService.cs`, and all DTOs under `DTOs/ServiceCenter/`.

---

## Base Route

`/api/service-centers`

---

## Endpoints

### 1. List All Centers  `GET /api/service-centers`

**Auth:** None required.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [ /* array of ServiceCenterDto */ ],
  "metadata": { "timestamp": "...", "totalCount": 5, "correlationId": "..." },
  "message": null
}
```

**Notes:**
- Returns all centers regardless of `isActive` status (filtering is UI-side).
- `metadata.totalCount` contains the count of items in `data`.

---

### 2. Get Center by ID  `GET /api/service-centers/{id}`

**Auth:** None required.

**Path parameter:** `id` (int, required)

**Responses:**

| Status | Condition |
|--------|-----------|
| 200 OK | Center found; returns `ApiResponse<ServiceCenterDto>` |
| 400 | `id <= 0`  `INVALID_SERVICE_CENTER_DATA` |
| 404 | Center not found  `SERVICE_CENTER_NOT_FOUND` |

---

### 3. Check Availability  `GET /api/service-centers/{id}/availability`

**Auth:** None required.

**Computed value:**
```
isAvailable = center.IsActive && (dateSpecificAvailability?.IsAvailable ?? true)
```

Lookup order:
1. Check `CenterAvailability` table for a row matching `centerId` + today's date  use that record's `IsAvailable` (and optionally overridden `openingTime`/`closingTime` and `reason`).
2. If no date-specific record, fall back to the center's `CenterOperatingDay` weekly schedule.

**Response `200 OK`:**
```json
{ "success": true, "data": true, "metadata": { ... } }
```

**Error responses:** 400 `INVALID_SERVICE_CENTER_DATA`, 404 `SERVICE_CENTER_NOT_FOUND`.

---

### 4. Get Location  `GET /api/service-centers/{id}/location`

**Auth:** None required.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "locationId": 1,
    "streetAddress": "No. 1, Main Street",
    "city": "Colombo",
    "district": "Colombo",
    "province": "Western Province",
    "postalCode": "00100",
    "country": "Sri Lanka",
    "latitude": 6.927079,
    "longitude": 79.861244,
    "googleMapsUrl": "https://maps.google.com/...",
    "landmark": "Opposite Keells supermarket"
  }
}
```

**Error responses:** 400 `INVALID_SERVICE_CENTER_DATA`, 404 `LOCATION_NOT_FOUND`.

---

### 5. Create Center  `POST /api/service-centers`

**Auth:** `[Authorize(Roles = "admin")]`

**Request body (`CreateServiceCenterRequestDto`):**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 2100 chars |
| `address` | string | Yes | 5255 chars |
| `timezone` | string | Yes | IANA timezone (e.g. `Asia/Colombo`); max 50 chars |
| `openingTime` | string | Yes | `HH:mm` format (e.g. `08:00`) |
| `closingTime` | string | Yes | `HH:mm` format |
| `phone` | string? | No | Valid phone; max 20 chars |
| `email` | string? | No | Valid email; max 100 chars |
| `description` | string? | No | Max 1000 chars |
| `capacity` | int | No | 110000; default `50` |
| `averageServiceTimeMinutes` | int | No | 1480; default `15` |
| `isActive` | bool | No | default `true` |
| `streetAddress`, `city`, `district`, `province`, `postalCode`, `country` | string? | No | Optional location fields; create a `center_locations` row atomically |
| `latitude` | decimal? | No | -90 to +90 (must be paired with `longitude`) |
| `longitude` | decimal? | No | -180 to +180 (must be paired with `latitude`) |
| `googleMapsUrl` | string? | No | Valid URL; max 500 chars |
| `landmark` | string? | No | Max 255 chars |

**Behaviour on creation:**
- Seeds a default MondayFriday operating schedule (`CenterOperatingDay` rows).
- If any location field is provided, creates a `center_locations` row atomically.

**Response `201 Created`:**
```json
{ "success": true, "data": { /* ServiceCenterDto */ } }
```

**Error responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Missing required fields or format errors |
| 401 | `TOKEN_MISSING` / `TOKEN_INVALID` | No or invalid JWT |
| 403 | `FORBIDDEN` | Not an admin |
| 409 | `DUPLICATE_SERVICE_CENTER` | Center with same name already exists |
| 500 | `INTERNAL_ERROR` | Unexpected error |

---

### 6. Upsert Location  `PUT /api/service-centers/{id}/location`

**Auth:** `[Authorize(Roles = "admin")]`

**Request body (`UpsertLocationRequestDto`):** All fields optional, same structure as the location fields in the create request. `latitude` and `longitude` must be supplied together.

**Response `200 OK`:** Updated `ApiResponse<ServiceCenterDto>` including new location.

**Error responses:** 400, 401, 403, 404.

---

## Data Model: `ServiceCenterDto`

| Field | Type | Notes |
|-------|------|-------|
| `centerId` | int | Primary key |
| `name` | string | Display name |
| `address` | string | Physical address |
| `phone` | string? | Optional |
| `email` | string? | Optional |
| `description` | string? | Optional |
| `timezone` | string | IANA timezone identifier |
| `capacity` | int | Max tokens per day |
| `averageServiceTimeMinutes` | int | Default 15 |
| `openingTime` | string | `HH:mm`  may be overridden by `CenterAvailability` |
| `closingTime` | string | `HH:mm`  may be overridden by `CenterAvailability` |
| `isAvailable` | bool | Computed: `IsActive && availability?.IsAvailable` |
| `isActive` | bool | Admin-controlled on/off switch |
| `createdAt` | DateTime | UTC creation timestamp |
| `location` | CenterLocationDto? | Null if no location row exists |

## Data Model: `CenterLocationDto`

| Field | Type |
|-------|------|
| `locationId` | int |
| `streetAddress` | string? |
| `city` | string? |
| `district` | string? |
| `province` | string? |
| `postalCode` | string? |
| `country` | string (default `Sri Lanka`) |
| `latitude` | decimal? |
| `longitude` | decimal? |
| `googleMapsUrl` | string? |
| `landmark` | string? |

---

## Availability Schedule Logic

Two tables control when a center is open:

| Table | Purpose |
|-------|---------|
| `CenterOperatingDay` | Default weekly schedule (day of week, `isOpen`, `openingTime`, `closingTime`) |
| `CenterAvailability` | Per-date override (a specific date can be marked unavailable with a `reason`, or have different hours) |

The service checks `CenterAvailability` first. If a matching row exists for today, it takes precedence over the weekly schedule.

---

## Response Wrappers

**Success (`ApiResponse<T>`):**
```json
{
  "success": true,
  "data": { ... },
  "metadata": { "timestamp": "2026-03-01T10:00:00Z", "totalCount": null, "correlationId": "abc-123" },
  "message": null
}
```

**Error (`ErrorResponse`):**
```json
{
  "success": false,
  "code": "SERVICE_CENTER_NOT_FOUND",
  "message": "Service center with id 99 was not found.",
  "details": null,
  "validationErrors": null,
  "timestamp": "2026-03-01T10:01:00Z",
  "path": "/api/service-centers/99",
  "correlationId": "abc-123"
}
```

---

*Document generated from source code: `ServiceCenterController.cs`, `ServiceCenterService.cs`, `DTOs/ServiceCenter/`.*
