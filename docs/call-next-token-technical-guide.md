# Call Next Token Feature - Technical Documentation

## Overview

The 'Call Next Token' feature implements queue management functionality that allows officers to call the next waiting customer token in FIFO order. This feature includes REST API endpoints, real-time SignalR broadcasting, and comprehensive error handling.

## API Reference

### Call Next Token

**Endpoint**: `POST /api/counters/{counterId}/call-next`

**Authorization**: Required - Bearer token with "officer" role

**Path Parameters**:
- `counterId` (integer): The ID of the counter calling the next token

**Response Codes**:
- `200 OK`: Token successfully called
- `400 Bad Request`: Counter is closed or invalid
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions (not an officer)
- `404 Not Found`: No waiting tokens available

**Success Response**:
```json
{
  "data": {
    "tokenId": 123,
    "centerId": 1,
    "counterId": 5,
    "userId": 456,
    "tokenNumber": "A001",
    "issuedDate": "2024-01-15",
    "status": "called",
    "issuedTime": "2024-01-15T10:30:00Z",
    "calledAt": "2024-01-15T11:45:00Z"
  },
  "message": "Token A001 has been called successfully."
}
```

**Error Response**:
```json
{
  "code": "NO_WAITING_TOKENS",
  "message": "There are no waiting tokens for this counter today."
}
```

### Update Token Status

**Endpoint**: `PUT /api/counters/{counterId}/tokens/{tokenId}/status`

**Authorization**: Required - Bearer token with "officer" role

**Path Parameters**:
- `counterId` (integer): The ID of the counter
- `tokenId` (integer): The ID of the token to update

**Request Body**:
```json
{
  "status": "served" | "skipped"
}
```

## Real-Time Updates

The system uses SignalR for real-time communication between server and clients.

### SignalR Hub

**Hub URL**: `/hubs/queue`

**Connection Requirements**:
- Valid JWT token in Authorization header
- Clients join groups based on center/counter IDs

### Events

#### QueueUpdated Event

Broadcast when a token is called or status changes.

**Group**: Counter-specific group (`counter:{counterId}`)

**Payload**:
```typescript
interface QueueUpdatedPayload {
  counterId: number;
  centerId: number;
  waitingTokens: QueueUpdatedWaitingTokenPayload[];
  waitingCount: number;
  servedCountToday: number;
  skippedCountToday: number;
  timestamp: string;
  triggerAction: string; // "TokenCalled", "TokenServed", etc.
}

interface QueueUpdatedWaitingTokenPayload {
  tokenId: number;
  tokenNumber: string;
  queuePosition: number;
  issuedAt: string;
  estimatedWaitSeconds: number;
}
```

#### TokenCalled Event

Broadcast when a token is called (alternative to QueueUpdated for specific token events).

**Group**: Center-specific group (`center:{centerId}`)

**Payload**:
```typescript
interface TokenCalledPayload {
  tokenId: number;
  centerId: number;
  counterId: number;
  userId: number | null;
  tokenNumber: string;
  issuedDate: string;
  status: string;
  issuedTime: string;
  calledAt: string;
}
```

### Client Integration

#### Frontend Hook Usage

```typescript
import { useQueueHub } from '../hooks/useQueueHub';

function CounterDashboard({ counterId, centerId }: { counterId: number; centerId: number }) {
  const {
    latestQueueUpdate,
    connectionStatus
  } = useQueueHub({
    centerId,
    counterId,
    isOfficer: true,
    enabled: true
  });

  // Handle real-time updates
  useEffect(() => {
    if (latestQueueUpdate) {
      // Update UI with new queue state
      updateQueueDisplay(latestQueueUpdate);
    }
  }, [latestQueueUpdate]);

  const handleCallNext = async () => {
    try {
      const calledToken = await counterApi.callNext(counterId);
      // Token called successfully - real-time update will follow
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      <button onClick={handleCallNext}>Call Next</button>
      {/* Queue display components */}
    </div>
  );
}
```

## Backend Implementation

### Service Layer

The `CounterService.CallNextTokenAsync()` method:

1. Validates counter is open
2. Atomically fetches and claims the next waiting token
3. Updates token status to "called"
4. Publishes `TokenCalledEvent` via event bus
5. Broadcasts `QueueUpdatedEvent` via SignalR

### Database Operations

The operation uses database transactions to ensure atomicity:

```sql
-- Pseudo-code for the atomic operation
BEGIN TRANSACTION;
  SELECT TOP 1 * FROM Tokens
  WHERE CounterId = @counterId AND Status = 'waiting'
  ORDER BY IssuedDate, IssuedTime;

  UPDATE Tokens SET Status = 'called', CalledAt = @now
  WHERE TokenId = @selectedTokenId;
COMMIT;
```

### Error Handling

- **Counter Closed**: `InvalidOperationException` when counter is not open
- **No Tokens**: Returns `null` from service method, handled as 404 in controller
- **Concurrency**: Database-level locking prevents race conditions
- **Broadcast Failures**: Logged as warnings, don't fail the operation

## Security Considerations

- **Authorization**: Only officers can call tokens
- **Counter Ownership**: Officers can only call tokens for their assigned counters
- **Rate Limiting**: Consider implementing rate limits to prevent abuse
- **Audit Logging**: All token calls are logged for accountability

## Performance Considerations

- **Database Indexing**: Ensure proper indexes on `CounterId`, `Status`, `IssuedDate`
- **Connection Pooling**: SignalR connections are pooled for efficiency
- **Event Deduplication**: Frontend handles duplicate events to prevent UI glitches
- **Caching**: Consider caching queue statistics for high-traffic scenarios

## Testing

### Unit Tests

- `CounterServiceTests.CallNextTokenAsync_*`: Test various scenarios
- `CounterControllerTests.CallNext_*`: Test API endpoints

### Integration Tests

- Test full workflow from API call to real-time updates
- Test concurrent calls from multiple officers
- Test error scenarios (closed counters, empty queues)

## Monitoring and Logging

- **Application Insights**: Track API usage and performance
- **SignalR Metrics**: Monitor connection counts and message rates
- **Error Logging**: All failures are logged with context
- **Audit Trail**: Token state changes are tracked for compliance</content>
<parameter name="filePath">c:\Users\user\Desktop\Qlanka-pro\docs\call-next-token-technical-guide.md