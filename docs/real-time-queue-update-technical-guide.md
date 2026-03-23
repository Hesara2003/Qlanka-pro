# Technical Guide: Real-time Queue Updates

This document provides a technical overview of the real-time synchronization between the Qlanka-pro backend and frontend using SignalR.

## Mechanism: SignalR (ASP.NET Core)

The system uses **SignalR** to provide a persistent, two-way communication channel between the server and the client.

### Hub Configuration (`QueueHub.cs`)
The `QueueHub` is the central server-side hub. It supports several groups for message isolation:
-   **`center:{centerId}`**: Receives updates relevant to the entire service center (e.g., token calls, reassignments).
-   **`counter:{counterId}`**: Receives updates specific to a particular officer's counter (e.g., queue length changes).

### Connection Setup (Frontend)
The `useQueueHub.ts` hook manages the connection life cycle using the `@microsoft/signalr` library:

```typescript
const connection = new HubConnectionBuilder()
    .withUrl(hubUrl, {
        accessTokenFactory: () => getAccessToken() ?? "",
    })
    .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s
            return RECONNECT_DELAYS_MS[Math.min(retryContext.previousRetryCount, RECONNECT_DELAYS_MS.length - 1)];
        }
    })
    .build();
```

---

## Event Reference

### `QueueUpdated`
Broadcasted when the waiting list for a center or counter changes.
-   **Payload**: `waitingTokens`, `waitingCount`, `servedCountToday`, `skippedCountToday`.

### `TokenCalled`
Broadcasted when an officer calls a customer token.
-   **Payload**: Full token details including `tokenNumber`, `calledAt`, and `counterId`.

### `TokenStatusUpdated`
Broadcasted when a token is marked as `served` or `skipped`.
-   **Payload**: `tokenId`, `newStatus`, `servedAt` | `skippedAt`.

---

## Reconnection Logic

The frontend implementation uses a robust three-tier reconnection strategy:

1.  **Exponential Backoff**: Up to 10 attempts with delays increasing from 1s to 30s.
2.  **Page Visibility Trigger**: If the connection is lost while the tab is inactive, the system will immediately attempt to reconnect when the user returns to the tab.
3.  **JWT Refresh**: Before every connection attempt, the system verifies and refreshes the JWT access token to ensure the SignalR handshake does not fail due to authentication errors.

---

## Configuration

### Backend (`Program.cs`)
The SignalR hub is mapped at `/hubs/queue` and requires CORS to be configured for the frontend origin with `AllowCredentials()` enabled.

### Frontend
The hub URL is resolved dynamically:
1.  **Environment Variable**: `VITE_API_BASE_URL` (strip `/api`).
2.  **Default**: `window.location.origin` if no variable is provided.
