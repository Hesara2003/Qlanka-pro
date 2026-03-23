# Technical Guide: Counter Management

This document provides a technical overview of the administrative Counter Management feature, including API specifications, data transfer objects, and access control logic.

## API Specification

All administrative counter operations are prefixed with `/api/admin/centers/{centerId}/counters`.

### Create Counter
**Endpoint**: `POST /api/admin/centers/{centerId}/counters`
**Authorization**: Bearer Token with `admin` role

#### Request Body (`CreateCounterRequestDto`)
-   `Name` (string, Required): The display name for the counter.
-   `AssignedOfficerUserId` (int, Optional): The ID of the authenticated officer to link with this counter.

---

### List Counters by Center
**Endpoint**: `GET /api/admin/centers/{centerId}/counters`
**Authorization**: Bearer Token with `admin` role

---

### Update Counter Status
**Endpoint**: `HttpPatch /api/admin/centers/{centerId}/counters/{counterId}/status`
**Authorization**: Bearer Token with `admin` role

#### Request Body (`UpdateCounterStatusRequestDto`)
-   `IsOpen` (bool): The target status of the counter.
-   `Reason` (string, Optional): The reason for closing the counter (stored for audit/logging).

---

## Role-Based Access Control (RBAC)

The Counter Management feature enforces strict role-based access:

1.  **Admin Role**:
    -   Full CRUD (Create, Read, Update, Delete) capability for all counters across all service centers.
    -   Can override officer assignments and force-close counters.
2.  **Officer Role**:
    -   Limited access. Can view their assigned counter's state via the `officer-dashboard` endpoint.
    -   Cannot create or delete counters.
    -   Can only update the status of their *own* assigned counter (handled via the `CounterController` officer-facing endpoints).

---

## Real-time Synchronization

When a counter's status changes (Open/Closed), the `CounterService` publishes a `CounterStatusChangedEvent`. This event is handled by the `QueueBroadcastService`, which triggers a SignalR broadcast to the `center:{centerId}` group.

### SignalR Event: `CounterStatusChanged`
**Payload**:
-   `counterId` (int)
-   `isOpen` (bool)
-   `counterName` (string)
-   `changedAt` (DateTime)

---

## Frontend Integration

The management interface is built using the following core components:
-   **`AdminCountersPage.tsx`**: The primary page for filtering centers and viewing counter stats.
-   **`CounterCard.tsx`**: Renders individual counter details and handles status toggle actions.
-   **`useCounterManagement.ts`**: A custom hook that encapsulates the API calls for fetching, creating, and updating counter status.
