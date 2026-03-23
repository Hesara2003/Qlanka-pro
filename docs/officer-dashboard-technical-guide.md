# Technical Guide: Officer Dashboard

This document provides a technical overview of the implementation, data flow, and real-time synchronization for the Officer Dashboard.

## API Specification

### 1. Fetch Dashboard Data
Returns the full dashboard payload for a specific counter.

**Endpoint**: `GET /api/counters/{counterId}/dashboard`
**Authorization**: Bearer Token with `officer` role
**Response**: `ApiResponse<CounterDashboardDto>`

### 2. Fetch Stats Only
Returns only the statistics card data (e.g., served count, average time).

**Endpoint**: `GET /api/counters/{counterId}/stats`
**Authorization**: Bearer Token with `officer` role
**Response**: `ApiResponse<CounterStatsDto>`

### 3. Fetch Waiting Tokens
Returns the updated list of waiting tokens for the specific counter.

**Endpoint**: `GET /api/counters/{counterId}/tokens/waiting`
**Authorization**: Bearer Token with `officer` role
**Response**: `ApiResponse<List<WaitingTokenDto>>`

---

## Data Structures (DTOs)

### `CounterDashboardDto`
| Field | Type | Description |
| :--- | :--- | :--- |
| `CounterId` | int | ID of the counter. |
| `IsOpen` | bool | Whether the counter is open and accepting new citizens. |
| `CurrentToken` | `CurrentTokenDto?` | The token currently being served (if any). |
| `WaitingTokens` | `List<WaitingTokenDto>` | The first 10 citizens in the queue for this counter. |
| `ServedCount` | int | Daily served count for the officer. |
| `SkippedCount` | int | Daily skipped count for the officer. |
| `AverageServiceTimeSeconds` | int | Rolling average of service speed. |

---

## Frontend Architecture

### State Management: `useCounter` Hook
The `useCounter.ts` hook is responsible for managing the dashboard's reactive state:
1.  **Polling & Initial Load**: Calls `/dashboard` on component mount.
2.  **Action Handlers**: Exposes `callNext`, `serveToken`, and `skipToken` functions.
3.  **Local State**: Maintains `calledToken`, `waitingTokens`, and `stats` locally to ensure zero-latency UI updates before server confirmation.

### Real-Time Updates: SignalR `QueueHub`
The dashboard maintains a persistent connection to the SignalR `QueueHub`:
-   **Group Subscription**: Officers are automatically added to the `counter:{id}` and `center:{id}` groups upon connection.
-   **Events**:
    -   `QueueUpdated`: Broadcasted when the waiting list change (new join, cancellation, reassignment).
    -   `TokenCalled`: Broadcasted when the officer calls a new token (syncs across multiple officer tabs).
    -   `TokenStatusUpdated`: Broadcasted when a token is marked as served/skipped.
    -   `TokenCancelled`: Broadcasted if a citizen cancels their token while in the queue.

---

## Technical Considerations

1.  **Group Isolation**: Dashboard events are scoped to the specific `counterId` or `centerId` to prevent cross-office data leakage.
2.  **Concurrency**: If two officers are logged into the same counter, SignalR ensures all actions (e.g., Calling Next) are mirrored across both browsers instantly.
3.  **Latency**: The UI uses optimistic updates for button loading states to provide a premium, snappy feel.
