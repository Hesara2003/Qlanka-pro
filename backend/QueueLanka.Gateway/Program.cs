using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using QueueLanka.Shared.Middleware;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var requireAuthByDefault = builder.Configuration.GetValue<bool?>("GatewayPolicies:Authentication:RequireAuthenticatedUserByDefault") ?? true;

var bookingRateLimitPath = builder.Configuration["GatewayPolicies:RateLimiting:Booking:Path"] ?? "/api/appointment/book";
var bookingRateLimitMethod = builder.Configuration["GatewayPolicies:RateLimiting:Booking:Method"] ?? HttpMethods.Post;
var bookingPermitLimit = builder.Configuration.GetValue<int?>("GatewayPolicies:RateLimiting:Booking:PermitLimit") ?? 5;
var bookingWindowMinutes = builder.Configuration.GetValue<int?>("GatewayPolicies:RateLimiting:Booking:WindowMinutes") ?? 1;
var bookingRejectionStatusCode = builder.Configuration.GetValue<int?>("GatewayPolicies:RateLimiting:Booking:RejectionStatusCode")
    ?? StatusCodes.Status429TooManyRequests;

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "CHANGE_ME_USE_ENV_VAR_IN_PRODUCTION_MIN_32_CHARS";
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "queuelanka-api",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "queuelanka-client",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization(options =>
{
    if (requireAuthByDefault)
    {
        // Enforce authentication by default for all endpoints unless explicitly marked anonymous.
        options.FallbackPolicy = new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .Build();
    }
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = bookingRejectionStatusCode;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var isBookingEndpoint = string.Equals(context.Request.Method, bookingRateLimitMethod, StringComparison.OrdinalIgnoreCase)
            && string.Equals(context.Request.Path.Value, bookingRateLimitPath, StringComparison.OrdinalIgnoreCase);

        if (!isBookingEndpoint)
        {
            return RateLimitPartition.GetNoLimiter("non-booking");
        }

        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip";
        var partitionKey = $"booking:{clientIp}";

        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = bookingPermitLimit,
            Window = TimeSpan.FromMinutes(bookingWindowMinutes),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            AutoReplenishment = true
        });
    });
});

var frontendOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { builder.Configuration["Cors:FrontendOrigin"] ?? "http://localhost:5173" };

static bool IsAllowedCorsOrigin(string origin, IEnumerable<string> configuredOrigins)
{
    if (string.IsNullOrWhiteSpace(origin))
    {
        return false;
    }

    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
    {
        return false;
    }

    if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
        && !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    var normalizedOrigin = $"{uri.Scheme}://{uri.Host}{(uri.IsDefaultPort ? string.Empty : $":{uri.Port}")}";

    foreach (var configured in configuredOrigins)
    {
        if (string.IsNullOrWhiteSpace(configured))
        {
            continue;
        }

        var normalizedConfigured = configured.Trim().TrimEnd('/');
        if (string.Equals(normalizedOrigin, normalizedConfigured, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }
    }

    if (string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase)
        || string.Equals(uri.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase))
    {
        return true;
    }

    return uri.Host.EndsWith(".azurewebsites.net", StringComparison.OrdinalIgnoreCase)
        || uri.Host.EndsWith(".azurecontainerapps.io", StringComparison.OrdinalIgnoreCase);
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.SetIsOriginAllowed(origin => IsAllowedCorsOrigin(origin, frontendOrigins))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("Content-Disposition"));
});

var app = builder.Build();

app.UseMiddleware<RequestContextLoggingMiddleware>();
app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Map health check
app.MapGet("/health", () => "Healthy").AllowAnonymous();

app.MapReverseProxy();

app.Run();
