# SCRUM-37 — Token Booking API (Contract)

This document describes the booking/token API behavior implemented in the backend and the recommended contract for SCRUM-37.

**Summary**
- Purpose: Book an appointment token at a specified service center, persist the appointment and token, and send a booking confirmation (email/notification) asynchronously.
- Main endpoint implemented: `POST /api/appointment/book` (requires authentication).

**Endpoint**

- POST /api/appointment/book
  - Auth: Bearer JWT (user must be authenticated)
  - Request body: `BookAppointmentRequestDto`
    - `CenterId` (int, required)
    - `AppointmentDate` (DateTime, required) — date part is used for issued date
    - `AppointmentTime` (TimeSpan, required)
  - Success Response: 200 OK with `ApiResponse<AppointmentResponseDto>`
    - `AppointmentResponseDto` includes: `AppointmentId`, `CenterId`, `UserId`, `TokenId`, `TokenNumber`, `AppointmentDate`, `AppointmentTime`, `Status`, `CreatedAt`
  - Error Responses (mapped by controller/service):
    - 400 Bad Request — model validation errors
    - 401 Unauthorized — missing/invalid JWT
    - 404 Not Found — center not found or inactive
    - 409 Conflict — booking conflict (double-booked time / center-specific conflict / operating hours violation)
    - 500 Internal Server Error — unexpected server errors

**Behavior (authoritative — implemented in code)**
- Flow implemented in `AppointmentService.BookTokenAsync`:
  1. Validate the service center exists and is active. (404 if missing/inactive)
  2. Prevent booking in the past (compares requested date/time to server UTC now). (409 on invalid)
  3. Check center availability for the requested date (specific overrides or weekly schedule). (409 if closed or outside operating hours)
  4. Check appointment double-booking via `_appointmentRepository.HasConflictAsync`. (409 if conflict)
  5. Capacity check via `_tokenRepository.CountByCenterAndDateAsync` vs `center.Capacity` (409 if full)
  6. Persist the Appointment (`_appointmentRepository.CreateAsync`).
  7. Generate a token number and persist the Token (`_token_repository.CreateAsync`).
     - Token number format (current implementation): `TKN-[CenterId]-[yyMMdd]-[RandomHex]` (example: `TKN-12-240301-A4B9`)
     - Token fields: `CenterId`, `UserId`, `AppointmentId`, `TokenNumber`, `IssuedDate` (requested date), `Status` = `Waiting`, `IssuedTime` = UTC now
  8. Fire-and-forget notification dispatch using `_notificationService.SendBookingConfirmationAsync` (background task). Exceptions are caught and logged.

**Token uniqueness and concurrency notes (from inspected code)**
- The code generates a token number using a GUID-based hex suffix but does not explicitly retry on collision. The repository exposes `GetByNumberDateCenterAsync` which can be used to check uniqueness.
- There is no DB-level unique constraint shown in the code. To guarantee uniqueness under concurrency, add a unique constraint on the token number or an atomic check-insert pattern.

**Confirmation delivery semantics**
- Notifications are dispatched asynchronously (background task) after token creation.
- Email sending is implemented via `SmtpEmailService.SendBookingEmailAsync`. The current flow is best-effort: email failures are logged and do not roll back the booking.

**Example Request (JSON)**
{
  "centerId": 12,
  "appointmentDate": "2024-03-01T00:00:00Z",
  "appointmentTime": "09:30:00"
}

**Example Success Response (200 OK)**
{
  "data": {
    "appointmentId": 123,
    "centerId": 12,
    "userId": 45,
    "tokenId": 987,
    "tokenNumber": "TKN-12-240301-A4B9",
    "appointmentDate": "2024-03-01T00:00:00Z",
    "appointmentTime": "09:30:00",
    "status": "Scheduled",
    "createdAt": "2024-02-28T14:22:10Z"
  },
  "metadata": { "correlationId": "..." },
  "message": "Token booked successfully."
}

**Edge cases & errors to document in API docs**
- Booking for a date/time in the past: returns 409 Conflict with code `BOOKING_CONFLICT`.
- Center closed on requested date: 409 Conflict.
- Time outside operating hours: 409 Conflict.
- Double booking for same slot: 409 Conflict.
- Center capacity reached for that date: 409 Conflict.

**Recommendations / Missing improvements**
- Return HTTP 201 Created on successful creation with `Location` header pointing to the booking resource (`/api/appointment/{id}`) instead of 200 OK.
- Add idempotency support (e.g., `Idempotency-Key` header) to prevent duplicate bookings from repeated requests.
- Add a DB-level unique constraint on token identifiers (or a composite unique index on `(CenterId, IssuedDate, TokenNumber)`) and handle insert conflicts by regenerating token number and retrying a few times.
- Use a durable background queue (e.g., Azure Service Bus / RabbitMQ / Hangfire) for notification delivery with retries, instead of fire-and-forget Task.Run, to improve delivery guarantees.
- Expose `GET /api/appointment/{id}` or `GET /api/booking/{tokenNumber}` to allow users to fetch booking details directly (useful for clients and `Location` header targets).

**References (code locations)**
- Booking flow: [backend/QueueLanka.API/Controllers/AppointmentController.cs](backend/QueueLanka.API/Controllers/AppointmentController.cs#L1-L200)
- Business logic: [backend/QueueLanka.API/Services/AppointmentService.cs](backend/QueueLanka.API/Services/AppointmentService.cs#L1-L260)
- Request DTO: [backend/QueueLanka.API/DTOs/Appointment/BookAppointmentRequestDto.cs](backend/QueueLanka.API/DTOs/Appointment/BookAppointmentRequestDto.cs#L1-L60)
- Response DTO: [backend/QueueLanka.API/DTOs/Appointment/AppointmentResponseDto.cs](backend/QueueLanka.API/DTOs/Appointment/AppointmentResponseDto.cs#L1-L80)
- Token persistence: [backend/QueueLanka.API/Data/TokenRepository.cs](backend/QueueLanka.API/Data/TokenRepository.cs#L1-L200)
- Email / notification: [backend/QueueLanka.API/Services/SmtpEmailService.cs](backend/QueueLanka.API/Services/SmtpEmailService.cs#L1-L260)
