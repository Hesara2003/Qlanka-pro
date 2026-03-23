# Technical Guide: Reassign Token Feature

This document provides a technical overview of the implementation for reassigning tokens to other counters.

## API Specification

### Reassign Token

**Endpoint**: `POST /api/counters/{counterId}/tokens/reassign`
**Authorization**: Bearer Token with `officer` or `admin` role
**Content-Type**: `application/json`

#### Request Path Parameters
- `counterId` (integer): ID of the source counter.

#### Request Body (`ReassignTokenRequestDto`)
```json
{
  "tokenId": 123,
  "targetCounterId": 456,
  "reason": "Wrong service type selected"
}
```

#### Response (200 OK)
Returns an `ApiResponse<ReassignTokenResponseDto>` with the updated token details and new queue position.

---

## Backend Implementation

### Service Layer (`CounterService.cs`)

The `ReassignTokenAsync` method handles the reassignment logic:
1.  **Validation**:
    -   Ensures source and target counters are different.
    -   Checks if the token is in a 'Waiting' or 'Called' state (Tokens already 'Served' or 'Skipped' cannot be reassigned).
    -   Verifies the target counter is "Open".
2.  **State Update**: Calls `_counterRepository.ReassignTokenAsync`, which updates the token's `CounterId`, `Status` (reset to 'Waiting'), and `QueuePosition`.
3.  **Event Publishing**: Publishes a `TokenReassignedEvent` to the internal event bus.
4.  **Real-Time Broadcast**: Triggers SignalR broadcasts via `_queueBroadcastService.BroadcastTokenReassigned`.
5.  **Audit Logging**: Detailed audit logs are generated asynchronously as described below.

### Audit Logging Details

Every reassignment generates a record in the `AuditLogs` table:
-   **Action**: `TokenReassigned`
-   **EntityType**: `Token`
-   **EntityId**: `[TokenId]`
-   **Details** (JSON):
    ```json
    {
      "TokenId": 123,
      "TokenNumber": "A001",
      "SourceCounterId": 1,
      "TargetCounterId": 5,
      "ReassignedAt": "2026-03-23T18:35:00Z",
      "Reason": "..."
    }
    ```

---

## Frontend Integration

### The `useCounter` Hook

The `reassignToken` function in `useCounter.ts` handles the API call and refreshes the dashboard:

```typescript
const reassignToken = useCallback(async (tokenId: number, targetCounterId: number, reason?: string) => {
    // 1. Set loading state
    // 2. Call counterApi.reassignToken
    // 3. Refresh dashboard and stats
    // 4. Return success/failure boolean
}, [counterId, fetchDashboard, fetchStats]);
```

### Components

1.  **`ReassignTokenModal.tsx`**: Renders the reassignment interface, including the target counter dropdown and optional reason field.
2.  **`WaitingTokensList.tsx`**: Contains the trigger button for the reassignment workflow.
3.  **`OfficerDashboardPage.tsx`**: Manages the `reassignmentBanner` state to provide visual confirmation of the transfer.

---

## Real-Time Synchronization

The feature relies on SignalR for cross-counter updates:
-   **Source Counter**: Receives a `QueueUpdated` event to remove the token from its list.
-   **Target Counter**: Receives a `QueueUpdated` event to add the token to its waiting list at the new position.
-   **Public Display**: Monitors `TokenReassigned` events to update the "Now Serving" or "Waiting" lists accordingly.
