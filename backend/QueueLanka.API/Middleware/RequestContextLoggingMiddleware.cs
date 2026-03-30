using System.Diagnostics;

namespace QueueLanka.API.Middleware;

/// <summary>
/// Adds request correlation context to logs and emits structured request start/completion entries.
/// </summary>
public class RequestContextLoggingMiddleware
{
    private const string RequestIdHeaderName = "X-Request-ID";

    private readonly RequestDelegate _next;
    private readonly ILogger<RequestContextLoggingMiddleware> _logger;

    public RequestContextLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestContextLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var incomingRequestId = context.Request.Headers[RequestIdHeaderName].FirstOrDefault();
        var requestId = string.IsNullOrWhiteSpace(incomingRequestId)
            ? context.TraceIdentifier
            : incomingRequestId.Trim();

        context.TraceIdentifier = requestId;
        context.Response.Headers[RequestIdHeaderName] = requestId;

        var traceId = Activity.Current?.TraceId.ToString() ?? requestId;
        var stopwatch = Stopwatch.StartNew();

        using (_logger.BeginScope(new Dictionary<string, object?>
        {
            ["RequestId"] = requestId,
            ["TraceId"] = traceId,
            ["Method"] = context.Request.Method,
            ["Path"] = context.Request.Path.Value
        }))
        {
            _logger.LogInformation(
                "HTTP request started. RequestId={RequestId} TraceId={TraceId} Method={Method} Path={Path} Query={QueryString}",
                requestId,
                traceId,
                context.Request.Method,
                context.Request.Path.Value,
                context.Request.QueryString.HasValue ? context.Request.QueryString.Value : string.Empty);

            await _next(context);

            stopwatch.Stop();

            _logger.LogInformation(
                "HTTP request completed. RequestId={RequestId} TraceId={TraceId} Method={Method} Path={Path} StatusCode={StatusCode} DurationMs={DurationMs}",
                requestId,
                traceId,
                context.Request.Method,
                context.Request.Path.Value,
                context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds);
        }
    }
}