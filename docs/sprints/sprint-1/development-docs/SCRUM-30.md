**SCRUM-30 — Service Center Listing API Contract**

**Summary**
This document defines the API contract for service center listing and related endpoints. It describes available endpoints, request and response formats, and the data models returned to clients. The contract is based on the server implementation in `backend/QueueLanka.API` (controller: `ServiceCenterController`, service: `ServiceCenterService`, DTOs under `DTOs/ServiceCenter`).

**Endpoints**

- `GET /api/service-centers`
	- Description: Returns all service centers with availability information and metadata (total count, correlation id).
	- Response: `200 OK` with `ApiResponse<IEnumerable<ServiceCenterDto>>`.

- `GET /api/service-centers/{id}`
	- Description: Returns a single service center by id with detailed fields.
	- Parameters: `id` (int, path)
	- Responses:
		- `200 OK` -> `ApiResponse<ServiceCenterDto>`
		- `400 Bad Request` -> `ErrorResponse` (invalid id)
		- `404 Not Found` -> `ErrorResponse` (center not found)

- `GET /api/service-centers/{id}/availability`
	- Description: Returns boolean availability for the specified center (considers active flag and today's availability schedule).
	- Responses:
		- `200 OK` -> `ApiResponse<bool>`
		- `400/404` -> `ErrorResponse`

- `GET /api/service-centers/{id}/location`
	- Description: Returns structured location record for center (may be null if not set).
	- Responses: `ApiResponse<CenterLocationDto>` or errors.

- `POST /api/service-centers` (admin only)
	- Description: Create a new service center. Request body: `CreateServiceCenterRequestDto`.
	- Responses: `201 Created` -> `ApiResponse<ServiceCenterDto>`; errors for validation, conflict, auth.

- `PUT /api/service-centers/{id}/location` (admin only)
	- Description: Upsert structured location for center. Request body: `UpsertLocationRequestDto`.

**Request / Response wrappers**

- Successful responses use `ApiResponse<T>` with fields: `success` (true), `data` (T), optional `metadata` with `timestamp`, `totalCount`, and `correlationId`, and `message`.
- Errors use standardized `ErrorResponse` with `success` (false), `code`, `message`, optional `details`, `validationErrors`, `timestamp`, `path`, and `correlationId`.

**Data models (DTOs)**

- `ServiceCenterDto` (returned by list and single endpoints)
	- `centerId` (int)
	- `name` (string)
	- `address` (string)
	- `phone` (string | null)
	- `email` (string | null)
	- `description` (string | null)
	- `timezone` (string) — IANA timezone identifier
	- `capacity` (int) — max tokens per day
	- `averageServiceTimeMinutes` (int)
	- `openingTime` (string, "HH:mm") — local opening time (from availability or center defaults)
	- `closingTime` (string, "HH:mm") — local closing time
	- `isAvailable` (bool) — computed: center.IsActive && (availability?.IsAvailable ?? true)
	- `isActive` (bool)
	- `createdAt` (DateTime)
	- `location` (`CenterLocationDto` | null)

- `CenterLocationDto` (embedded in `ServiceCenterDto` or returned separately)
	- `locationId` (int)
	- `streetAddress`, `city`, `district`, `province`, `postalCode`, `country` (strings)
	- `latitude`, `longitude` (decimal? — optional)
	- `googleMapsUrl` (string? — optional)
	- `landmark` (string? — optional)

- `CreateServiceCenterRequestDto` (request body for POST)
	- Required: `name`, `address`, `timezone`, `openingTime` (HH:mm), `closingTime` (HH:mm)
	- Optional: `phone`, `email`, `description`, `capacity`, `averageServiceTimeMinutes`, location fields (`streetAddress`, `city`, `latitude`, `longitude`, etc.)

**Availability semantics**

- The service calculates availability per center for today via repository `GetAvailabilityForDateAsync`. When an availability record exists for today, `openingTime`/`closingTime` may be overridden and `IsAvailable` reflects that availability. If no availability record exists, center defaults are used.
- `isAvailable` returned in DTO is a boolean representing whether the center is both active (`IsActive`) and available according to today's schedule.

**Validation and errors**

- Input validation errors return `ErrorResponse` with code `VALIDATION_ERROR` and list of `validationErrors`.
- If the requested center id <= 0, controller throws `InvalidServiceCenterDataException` which yields 400 with a descriptive code.
- Not found results in `ServiceCenterNotFoundException` which yields 404 and an error code.

**Usage examples**

- Get all centers (fetch and read metadata):

	GET /api/service-centers

	Response: 200
	{
		"success": true,
		"data": [ { /* ServiceCenterDto */ } ],
		"metadata": { "totalCount": 5, "correlationId": "..." },
		"message": "Retrieved 5 service center(s)"
	}

- Check availability for center 12:

	GET /api/service-centers/12/availability

	Response: 200
	{
		"success": true,
		"data": true,
		"metadata": { "correlationId": "..." },
		"message": "Service center is currently available"
	}

**Implementation notes (from code)**

- `ServiceCenterService.GetAllServiceCentersAsync` maps domain model to `ServiceCenterDto` and queries today's availability for each center.
- `OpeningTime` and `ClosingTime` in DTO are strings in `HH:mm` format produced from availability (if present) or the center defaults.
- Creation (`POST`) validates opening/closing times and location pairing (latitude with longitude).


Document created by inspecting `ServiceCenterController`, `ServiceCenterService`, and DTOs under `backend/QueueLanka.API/DTOs/ServiceCenter`.
