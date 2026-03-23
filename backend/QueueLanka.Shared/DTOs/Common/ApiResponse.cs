namespace QueueLanka.Shared.DTOs.Common;

/// <summary>
/// Standardized API response wrapper for successful responses - SCRUM-29
/// </summary>
/// <typeparam name="T">The type of data being returned</typeparam>
public class ApiResponse<T>
{
    /// <summary>Indicates whether the request was successful</summary>
    public bool Success { get; set; } = true;

    /// <summary>The response data</summary>
    public T? Data { get; set; }

    /// <summary>Additional metadata about the response</summary>
    public ResponseMetadata? Metadata { get; set; }

    /// <summary>Human-readable message (optional)</summary>
    public string? Message { get; set; }

    public ApiResponse() { }

    public ApiResponse(T data, string? message = null)
    {
        Data = data;
        Message = message;
    }

    public ApiResponse(T data, ResponseMetadata metadata, string? message = null)
    {
        Data = data;
        Metadata = metadata;
        Message = message;
    }
}

/// <summary>
/// Metadata for API responses
/// </summary>
public class ResponseMetadata
{
    /// <summary>Timestamp when the response was generated</summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>Total count of items (for list responses)</summary>
    public int? TotalCount { get; set; }

    /// <summary>Page number (for paginated responses)</summary>
    public int? Page { get; set; }

    /// <summary>Page size (for paginated responses)</summary>
    public int? PageSize { get; set; }

    /// <summary>Request correlation ID for tracking</summary>
    public string? CorrelationId { get; set; }
}

/// <summary>
/// Standardized error response format - SCRUM-29
/// </summary>
public class ErrorResponse
{
    /// <summary>Indicates the request failed</summary>
    public bool Success { get; set; } = false;

    /// <summary>Error code for programmatic handling</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>User-friendly error message</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Additional error details (optional, for debugging)</summary>
    public object? Details { get; set; }

    /// <summary>List of validation errors (if applicable)</summary>
    public List<ValidationError>? ValidationErrors { get; set; }

    /// <summary>Timestamp when the error occurred</summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>Request path that caused the error</summary>
    public string? Path { get; set; }

    /// <summary>Correlation ID for tracking</summary>
    public string? CorrelationId { get; set; }

    public ErrorResponse() { }

    public ErrorResponse(string code, string message)
    {
        Code = code;
        Message = message;
    }
}

/// <summary>
/// Represents a single validation error
/// </summary>
public class ValidationError
{
    /// <summary>The field that failed validation</summary>
    public string Field { get; set; } = string.Empty;

    /// <summary>The validation error message</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>The value that was rejected (optional)</summary>
    public object? RejectedValue { get; set; }

    public ValidationError() { }

    public ValidationError(string field, string message, object? rejectedValue = null)
    {
        Field = field;
        Message = message;
        RejectedValue = rejectedValue;
    }
}
