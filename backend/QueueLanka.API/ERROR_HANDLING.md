# API Error Handling and Response Formatting - SCRUM-29

## Overview

This document describes the standardized error handling and response formatting implemented for the QueueLanka API, ensuring consistent, user-friendly, and well-documented API responses.

## Acceptance Criteria Status

✅ **Establish consistent error handling for the API**
- Global exception middleware catches all errors
- Specific exception types for different error scenarios
- Automatic validation error handling

✅ **Ensure errors are communicated clearly to users**
- Standardized error response format
- User-friendly error messages
- Error codes for programmatic handling

✅ **Format responses to be user-friendly**
- Consistent response wrapper for all successful responses
- Metadata included (timestamp, correlation ID, counts)
- Clear success/error indicators

✅ **Document error handling and response formats thoroughly**
- Comprehensive documentation (this file)
- XML comments on all controllers and DTOs
- OpenAPI/Swagger documentation

---

## Response Formats

### Success Response Format

All successful API responses follow this standardized format:

```json
{
  "success": true,
  "data": { /* actual response data */ },
  "metadata": {
    "timestamp": "2026-02-27T10:30:00Z",
    "totalCount": 5,
    "correlationId": "0HN4GKQJ7K9MN"
  },
  "message": "Operation completed successfully"
}
```

**Fields:**
- `success` (boolean): Always `true` for successful responses
- `data` (T): The actual response payload
- `metadata` (object, optional): Additional response metadata
  - `timestamp` (string): UTC timestamp when response was generated
  - `totalCount` (number, optional): Total count of items (for list responses)
  - `page` (number, optional): Current page number (for paginated responses)
  - `pageSize` (number, optional): Items per page (for paginated responses)
  - `correlationId` (string): Unique request identifier for tracking
- `message` (string, optional): Human-readable success message

### Error Response Format

All error responses follow this standardized format:

```json
{
  "success": false,
  "code": "SERVICE_CENTER_NOT_FOUND",
  "message": "Service center with ID 123 was not found.",
  "details": null,
  "validationErrors": null,
  "timestamp": "2026-02-27T10:30:00Z",
  "path": "/api/service-centers/123",
  "correlationId": "0HN4GKQJ7K9MN"
}
```

**Fields:**
- `success` (boolean): Always `false` for error responses
- `code` (string): Machine-readable error code for programmatic handling
- `message` (string): User-friendly error message
- `details` (object, optional): Additional error details (only in development mode)
- `validationErrors` (array, optional): List of validation errors if applicable
- `timestamp` (string): UTC timestamp when error occurred
- `path` (string): API path that caused the error
- `correlationId` (string): Unique request identifier for tracking

---

## HTTP Status Codes

### Success Codes
- **200 OK**: Request successful, data returned
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no data returned

### Client Error Codes
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Requested resource not found
- **422 Unprocessable Entity**: Semantic errors in request

### Server Error Codes
- **500 Internal Server Error**: Unexpected server error
- **503 Service Unavailable**: Service temporarily unavailable

---

## Error Codes

### General Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Unexpected server error occurred |
| `VALIDATION_ERROR` | 400 | One or more validation errors occurred |
| `DATA_ACCESS_ERROR` | 500 | Database or data access error |

### Service Center Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `SERVICE_CENTER_NOT_FOUND` | 404 | Service center with specified ID not found |
| `SERVICE_CENTER_UNAVAILABLE` | 503 | Service center is currently unavailable |
| `INVALID_SERVICE_CENTER_DATA` | 400 | Invalid service center data provided |

### Authentication Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Invalid username or password |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `ACCOUNT_DISABLED` | 403 | Account has been disabled |
| `INVALID_TOKEN` | 401 | Invalid or expired authentication token |

---

## Validation Errors

Validation errors include detailed information about each field that failed validation:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "One or more validation errors occurred",
  "validationErrors": [
    {
      "field": "email",
      "message": "Email address is required",
      "rejectedValue": null
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "rejectedValue": "short"
    }
  ],
  "timestamp": "2026-02-27T10:30:00Z",
  "path": "/api/auth/register",
  "correlationId": "0HN4GKQJ7K9MN"
}
```

**Validation Error Fields:**
- `field` (string): The name of the field that failed validation
- `message` (string): Description of the validation error
- `rejectedValue` (any, optional): The value that was rejected

---

## Exception Handling Architecture

### Exception Middleware
Global exception middleware (`ExceptionMiddleware.cs`) catches all unhandled exceptions and converts them to standardized error responses.

**Features:**
- Catches both application exceptions and unexpected errors
- Logs all errors with appropriate severity
- Includes stack traces in development mode only
- Adds correlation IDs for request tracking
- Enriches error responses with contextual information

### Custom Exception Types

#### AppException (Base Class)
Base exception for all application-specific errors.

```csharp
public class AppException : Exception
{
    public int StatusCode { get; }
    public string Code { get; }
}
```

#### Service Center Exceptions

**ServiceCenterNotFoundException**
```csharp
throw new ServiceCenterNotFoundException(centerId);
// Returns: 404 with code "SERVICE_CENTER_NOT_FOUND"
```

**ServiceCenterUnavailableException**
```csharp
throw new ServiceCenterUnavailableException(centerId, "Closed for maintenance");
// Returns: 503 with code "SERVICE_CENTER_UNAVAILABLE"
```

**InvalidServiceCenterDataException**
```csharp
throw new InvalidServiceCenterDataException("Service center ID must be greater than zero");
// Returns: 400 with code "INVALID_SERVICE_CENTER_DATA"
```

**DataAccessException**
```csharp
throw new DataAccessException("Failed to connect to database", innerException);
// Returns: 500 with code "DATA_ACCESS_ERROR"
```

### Validation Filter
Automatic validation of request models using data annotations.

- Intercepts requests before reaching the controller
- Validates request models against data annotations
- Returns standardized validation error responses
- No need for manual `ModelState.IsValid` checks

---

## API Endpoints

### Get All Service Centers

**Endpoint:** `GET /api/service-centers`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "centerId": 1,
      "name": "Colombo Service Center",
      "address": "123 Main St, Colombo",
      "phone": "+94112345678",
      "email": "colombo@queuelanka.lk",
      "description": "Main service center in Colombo",
      "timezone": "Asia/Colombo",
      "capacity": 50,
      "openingTime": "08:00",
      "closingTime": "17:00",
      "isAvailable": true,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "metadata": {
    "timestamp": "2026-02-27T10:30:00Z",
    "totalCount": 1,
    "correlationId": "0HN4GKQJ7K9MN"
  },
  "message": "Retrieved 1 service center(s)"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "code": "DATA_ACCESS_ERROR",
  "message": "Failed to retrieve service centers",
  "timestamp": "2026-02-27T10:30:00Z",
  "path": "/api/service-centers",
  "correlationId": "0HN4GKQJ7K9MN"
}
```

### Get Service Center by ID

**Endpoint:** `GET /api/service-centers/{id}`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "centerId": 1,
    "name": "Colombo Service Center",
    "address": "123 Main St, Colombo",
    "isAvailable": true,
    "isActive": true
  },
  "metadata": {
    "timestamp": "2026-02-27T10:30:00Z",
    "correlationId": "0HN4GKQJ7K9MN"
  },
  "message": "Service center retrieved successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "code": "SERVICE_CENTER_NOT_FOUND",
  "message": "Service center with ID 999 was not found.",
  "timestamp": "2026-02-27T10:30:00Z",
  "path": "/api/service-centers/999",
  "correlationId": "0HN4GKQJ7K9MN"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "code": "INVALID_SERVICE_CENTER_DATA",
  "message": "Service center ID must be greater than zero",
  "timestamp": "2026-02-27T10:30:00Z",
  "path": "/api/service-centers/-1",
  "correlationId": "0HN4GKQJ7K9MN"
}
```

### Check Service Center Availability

**Endpoint:** `GET /api/service-centers/{id}/availability`

**Success Response (200):**
```json
{
  "success": true,
  "data": true,
  "metadata": {
    "timestamp": "2026-02-27T10:30:00Z",
    "correlationId": "0HN4GKQJ7K9MN"
  },
  "message": "Service center is currently available"
}
```

---

## Development vs Production

### Development Mode
- Includes detailed error information (stack traces, exception types)
- Pretty-printed JSON responses (indented)
- More verbose logging

### Production Mode
- Error details hidden from responses
- Compact JSON responses
- Limited error information for security

---

## Best Practices

### For Frontend Developers

1. **Always check the `success` field** to determine if the request succeeded
2. **Use `correlationId`** when reporting issues to support
3. **Handle error codes programmatically** instead of parsing messages
4. **Display `message`** field to users for friendly error messages
5. **Show validation errors** field-by-field for form validation

### For Backend Developers

1. **Use specific exception types** instead of generic exceptions
2. **Include context** in error messages (e.g., which resource, what ID)
3. **Log errors** with appropriate severity levels
4. **Don't expose sensitive information** in error messages
5. **Use data annotations** for model validation

---

## Error Logging

All errors are logged with the following information:
- Exception type and message
- Stack trace (for unhandled exceptions)
- Request path and method
- Correlation ID
- Timestamp
- User information (if authenticated)

**Log Levels:**
- `Warning`: Application exceptions (expected errors)
- `Error`: Unhandled exceptions (unexpected errors)
- `Information`: Successful requests (optional)

---

## Troubleshooting

### Using Correlation IDs
Every request has a unique correlation ID that can be used to track the request through logs:

1. Extract `correlationId` from error response
2. Search application logs for that ID
3. View complete request/response cycle

### Common Issues

**Issue:** Receiving 500 errors
- **Solution:** Check application logs using correlation ID

**Issue:** Validation errors not showing
- **Solution:** Ensure data annotations are present on DTO properties

**Issue:** Error details not visible
- **Solution:** Check if running in development mode

---

## Testing Error Handling

### Test Invalid ID
```bash
GET /api/service-centers/-1
# Expected: 400 with INVALID_SERVICE_CENTER_DATA
```

### Test Not Found
```bash
GET /api/service-centers/99999
# Expected: 404 with SERVICE_CENTER_NOT_FOUND
```

### Test Server Error
Temporarily break database connection:
```bash
GET /api/service-centers
# Expected: 500 with DATA_ACCESS_ERROR or INTERNAL_ERROR
```

---

## Migration Guide

### Updating Existing Endpoints

1. Wrap successful responses in `ApiResponse<T>`:
```csharp
// Before
return Ok(data);

// After
return Ok(new ApiResponse<T>(data, "Success message"));
```

2. Throw specific exceptions instead of returning error responses:
```csharp
// Before
if (item == null)
    return NotFound(new { error = "Not found" });

// After
if (item == null)
    throw new ItemNotFoundException(id);
```

3. Remove manual `ModelState.IsValid` checks:
```csharp
// Before
if (!ModelState.IsValid)
    return BadRequest(ModelState);
// (This is now handled automatically by ValidationFilter)

// After
// No validation check needed - filter handles it
```

---

## Summary

The implemented error handling system provides:

✅ **Consistency**: All responses follow the same format
✅ **Clarity**: User-friendly messages with technical error codes
✅ **Traceability**: Correlation IDs for tracking requests
✅ **Debugging**: Detailed error info in development mode
✅ **Security**: Limited error exposure in production
✅ **Documentation**: Comprehensive docs and Swagger integration
✅ **Validation**: Automatic request validation
✅ **Logging**: Complete error logging for troubleshooting

This ensures a robust, user-friendly, and maintainable API error handling system.
