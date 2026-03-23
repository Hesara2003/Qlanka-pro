# API Contract: Call Next Token Endpoint

## Overview

This document specifies the API contract for the 'Call Next Token' endpoint, which enables officers to call the next waiting customer token in a queue management system.

## Endpoint Specification

### HTTP Method
`POST`

### URL
`/api/counters/{counterId}/call-next`

### Authentication
- **Type**: Bearer Token (JWT)
- **Required Roles**: `officer`
- **Header**: `Authorization: Bearer <jwt-token>`

## Request

### Path Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `counterId` | integer | Yes | The unique identifier of the counter | Must be > 0 |

### Request Body
**Empty body** - No request payload required.

### Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Authorization` | `Bearer <jwt-token>` | Yes | JWT token for officer authentication |
| `Content-Type` | `application/json` | Yes | Content type specification |

### Example Request
```http
POST /api/counters/5/call-next
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{}
```

## Response

### Success Response (200 OK)

#### Response Body Structure
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

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful responses |
| `data.tokenId` | integer | Unique identifier of the called token |
| `data.centerId` | integer | ID of the service center |
| `data.counterId` | integer | ID of the counter that called the token |
| `data.userId` | integer \| null | ID of the user who owns the token |
| `data.tokenNumber` | string | Human-readable token number (e.g., "A001") |
| `data.issuedDate` | string | Date when token was issued (ISO 8601 date) |
| `data.status` | string | Token status, always "called" for this response |
| `data.issuedTime` | string | Time when token was issued (ISO 8601 datetime) |
| `data.calledAt` | string | Timestamp when token was called (ISO 8601 datetime) |
| `metadata.timestamp` | string | Server timestamp of the response |
| `metadata.correlationId` | string | Unique request correlation ID |
| `message` | string | Human-readable success message |

## Error Responses

### 400 Bad Request - Counter Closed
```json
{
  "code": "COUNTER_CLOSED",
  "message": "Counter is closed or does not exist."
}
```

### 401 Unauthorized - Authentication Failed
```json
{
  "code": "INVALID_TOKEN",
  "message": "Authentication token is missing or invalid."
}
```

### 403 Forbidden - Insufficient Permissions
```json
{
  "code": "FORBIDDEN",
  "message": "Access denied. Officer role required."
}
```

### 404 Not Found - No Waiting Tokens
```json
{
  "code": "NO_WAITING_TOKENS",
  "message": "There are no waiting tokens for this counter today."
}
```

### 500 Internal Server Error - Server Error
```json
{
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred. Please try again later."
}
```

## Error Handling Procedures

### Client-Side Error Handling

1. **Network Errors**: Implement retry logic with exponential backoff
2. **Authentication Errors (401/403)**: Redirect to login or show permission error
3. **Business Logic Errors (400/404)**: Display user-friendly messages based on error codes
4. **Server Errors (500)**: Show generic error message and suggest retry

### Error Code Mapping

| HTTP Status | Error Code | User Message | Action Required |
|-------------|------------|--------------|----------------|
| 400 | COUNTER_CLOSED | "This counter is currently closed." | Wait for counter to open |
| 401 | INVALID_TOKEN | "Your session has expired. Please sign in again." | Re-authenticate |
| 403 | FORBIDDEN | "You don't have permission to perform this action." | Contact administrator |
| 404 | NO_WAITING_TOKENS | "No customers are currently waiting." | Inform user of empty queue |
| 500 | INTERNAL_ERROR | "Service temporarily unavailable. Please try again." | Retry after delay |

## Business Rules

### Preconditions
- Counter must exist and be in "open" status
- Officer must be authenticated and authorized
- At least one token must be in "waiting" status for the counter

### Postconditions
- Selected token status changes from "waiting" to "called"
- `calledAt` timestamp is set to current UTC time
- Real-time queue updates are broadcast to all connected clients
- Token is atomically claimed to prevent race conditions

### Atomicity Guarantees
- Token selection and status update occur in a single database transaction
- If multiple officers call simultaneously, only one succeeds
- Failed operations leave no partial state changes

## Real-Time Updates

### SignalR Events
This endpoint triggers the following real-time events:

#### QueueUpdated Event
- **Group**: `counter:{counterId}`
- **Purpose**: Updates all clients with current queue state
- **Payload**: Contains waiting tokens, counts, and statistics

#### TokenCalled Event (Optional)
- **Group**: `center:{centerId}`
- **Purpose**: Notifies about specific token being called
- **Payload**: Token details and calling information

### Client Integration Requirements
- Clients should subscribe to counter-specific SignalR groups
- Implement event handlers for `QueueUpdated` events
- Update UI immediately upon receiving real-time updates
- Handle connection drops and reconnections gracefully

## Performance Considerations

### Rate Limiting
- Consider implementing rate limits to prevent abuse
- Recommended: 1 call per second per officer per counter

### Caching
- Queue statistics may be cached for high-traffic scenarios
- Cache invalidation required on token state changes

### Monitoring
- Track API usage and response times
- Monitor queue depth and service rates
- Alert on unusual patterns (e.g., no tokens called for extended periods)

## Testing Scenarios

### Positive Test Cases
1. Call next token when queue has waiting tokens
2. Verify token status changes to "called"
3. Verify real-time updates are broadcast
4. Verify atomicity under concurrent calls

### Negative Test Cases
1. Call next token when counter is closed
2. Call next token with invalid counter ID
3. Call next token without authentication
4. Call next token with insufficient permissions
5. Call next token when no tokens are waiting

### Edge Cases
1. Multiple officers calling simultaneously
2. Token called while being processed by another officer
3. Network interruption during call
4. Database connection issues during transaction</content>
<parameter name="filePath">c:\Users\user\Desktop\Qlanka-pro\docs\call-next-token-api-contract.md