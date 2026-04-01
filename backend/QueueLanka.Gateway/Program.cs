using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
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

var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    throw new InvalidOperationException(
        "JWT secret is not configured. Set the 'Jwt__Secret' environment variable (or 'Jwt:Secret' in user secrets / Key Vault) before starting the gateway.");
}

const int MinJwtSecretLength = 32;
if (jwtSecret.Length < MinJwtSecretLength)
{
    throw new InvalidOperationException(
        $"JWT secret does not meet the minimum length requirement of {MinJwtSecretLength} characters.");
}

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

    // Policy used by the reverse-proxy to mark routes (e.g. /api/auth/**) as anonymous.
    // This policy imposes no requirements, so authorization always succeeds, even
    // when the global FallbackPolicy requires authenticated users.
    options.AddPolicy("anonymous", policy =>
    {
        policy.RequireAssertion(_ => true);
    });
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

        // NOTE: X-Forwarded-For can be spoofed by clients. In production, configure
        // ForwardedHeadersOptions (KnownProxies / KnownNetworks) via UseForwardedHeaders
        // middleware so that only headers set by trusted proxies are accepted.
        var xForwardedFor = context.Request.Headers["X-Forwarded-For"].ToString();
        string? clientIp;

        if (!string.IsNullOrWhiteSpace(xForwardedFor))
        {
            // X-Forwarded-For may contain multiple IPs: client, proxy1, proxy2, ...
            var firstCommaIndex = xForwardedFor.IndexOf(',');
            clientIp = firstCommaIndex >= 0
                ? xForwardedFor.Substring(0, firstCommaIndex).Trim()
                : xForwardedFor.Trim();
        }
        else
        {
            var xRealIp = context.Request.Headers["X-Real-IP"].ToString();
            clientIp = !string.IsNullOrWhiteSpace(xRealIp)
                ? xRealIp.Trim()
                : context.Connection.RemoteIpAddress?.ToString();
        }

        clientIp ??= "unknown-ip";
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

app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Map health check
app.MapGet("/health", () => "Healthy").AllowAnonymous();

app.MapReverseProxy();

app.Run();
