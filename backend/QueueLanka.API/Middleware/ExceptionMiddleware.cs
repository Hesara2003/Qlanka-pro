using QueueLanka.API.DTOs.Common;
using QueueLanka.API.Exceptions;
using System.Text.Json;

namespace QueueLanka.API.Middleware;

/// <summary>
/// Global exception handling middleware - Enhanced for SCRUM-29
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public ExceptionMiddleware(
        RequestDelegate next, 
        ILogger<ExceptionMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next   = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            _logger.LogWarning(ex, "Application exception: {Code} - {Message}", ex.Code, ex.Message);
            await WriteErrorResponseAsync(context, ex.StatusCode, ex.Code, ex.Message, ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred");
            await WriteErrorResponseAsync(
                context, 
                500, 
                "INTERNAL_ERROR", 
                "An unexpected error occurred. Please try again later.", 
                ex
            );
        }
    }

    private async Task WriteErrorResponseAsync(
        HttpContext context, 
        int status, 
        string code, 
        string message,
        Exception? exception = null)
    {
        context.Response.StatusCode  = status;
        context.Response.ContentType = "application/json";

        var correlationId = context.TraceIdentifier;
        
        var errorResponse = new ErrorResponse
        {
            Code = code,
            Message = message,
            Timestamp = DateTime.UtcNow,
            Path = context.Request.Path,
            CorrelationId = correlationId
        };

        // Include detailed error information only in development
        if (_environment.IsDevelopment() && exception != null)
        {
            errorResponse.Details = new
            {
                ExceptionType = exception.GetType().Name,
                StackTrace = exception.StackTrace,
                InnerException = exception.InnerException?.Message
            };
        }

        // Add custom data from AppException if available
        if (exception is AppException appEx && appEx.Data.Count > 0)
        {
            var additionalData = new Dictionary<string, object?>();
            foreach (var key in appEx.Data.Keys)
            {
                additionalData[key.ToString() ?? ""] = appEx.Data[key];
            }
            
            if (_environment.IsDevelopment())
            {
                errorResponse.Details = additionalData;
            }
        }

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = _environment.IsDevelopment()
        };

        var body = JsonSerializer.Serialize(errorResponse, options);
        await context.Response.WriteAsync(body);
    }
}
