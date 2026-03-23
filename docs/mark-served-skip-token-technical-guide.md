# Technical Guide: Mark Served & Skip Token Features

This document provides a technical overview of the implementation for marking tokens as served or skipped.

## API Specification

### Update Token Status

**Endpoint**: `PUT /api/counters/{counterId}/tokens/{tokenId}/status`
**Authorization**: Bearer Token with `officer` role
**Content-Type**: `application/json`

#### Request Path Parameters
- `counterId` (integer): ID of the counter.
- `tokenId` (integer): ID of the token to update.

#### Request Body
```json
{
  "status": "served" | "skipped"
}
```

#### Response (200 OK)
Returns an `ApiResponse<UpdateTokenStatusResponseDto>` containing the updated token details and service statistics.

---

## Backend Implementation

### Service Layer (`CounterService.cs`)

The `UpdateTokenStatusAsync` method follows these steps:
1.  **Validation**: Ensures the status is either "served" or "skipped".
2.  **Persistence**: Calls `_counterRepository.UpdateTokenStatusAsync`. This is atomic and performs the following:
    -   Updates token status to the requested value.
    -   Sets `ServedTime` if the status is "served".
    -   Calculates final service duration.
3.  **Event Publishing**: Publishes a `TokenStatusUpdatedEvent` to the internal event bus.
4.  **Real-Time Broadcast**: Triggers a SignalR broadcast via `_queueBroadcastService` to both the `counter:{counterId}` and `center:{centerId}` groups.

### Real-Time Update Mechanism

#### SignalR Events
The following events are broadcast to update sub-clients (e.g., public displays, dashboards):
-   `TokenStatusUpdatedEvent`: Contains the updated token ID, number, status, and completion timestamps.
-   `QueueUpdatedEvent`: Triggered after status update to refresh queue lengths and statistics across all officer dashboards.

---

## Frontend Integration

### The `useCounter` Hook

The `useCounter` hook exposes `serveToken` and `skipToken` functions for dashboard components.

```typescript
const serveToken = useCallback(async () => {
    // 1. Set local loading state
    // 2. Call counterApi.updateTokenStatus
    // 3. Set actionOutcome for UI feedback
    // 4. Reset current token state
    // 5. Refresh dashboard and stats
}, [calledToken, counterId, ...]);
```

### Component Architecture

1.  **`TokenActionButtons.tsx`**: Renders the buttons and handles the two-step confirmation workflow to prevent accidental clicks.
2.  **`CurrentTokenDisplay.tsx`**: Monitors the `actionOutcome` state from `useCounter` to show success/skip messages for 3 seconds before resetting.
3.  **`useQueueHub.ts`**: Subscribes to SignalR `TokenStatusUpdated` events to ensure cross-tab synchronization.

## Error Handling & Retries

-   **`INVALID_STATUS`**: Occurs if the token is no longer in a 'called' state (e.g., if another officer already updated it). The UI resets the dashboard and fetches fresh data.
-   **`NETWORK_ERROR`**: The action is marked as `retryable`, allowing the user to attempt the status update again without re-entering the confirmation flow.
