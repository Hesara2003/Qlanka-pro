using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using QueueLanka.Shared.Middleware;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// -------------------- Forwarded Headers --------------------
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

    var trustedProxies = builder.Configuration.GetSection("ForwardedHeaders:TrustedProxies").Get<string[]>();
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();

    if (trustedProxies is { Length: > 0 })
    {
        foreach (var proxyIp in trustedProxies)
        {
            if (System.Net.IPAddress.TryParse(proxyIp, out var ip))
            {
                options.KnownProxies.Add(ip);
            }
        }
    }
});

// -------------------- Reverse Proxy --------------------
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// -------------------- Gateway Policy Config --------------------
var requireAuthByDefault =
    builder.Configuration.GetValue<bool?>("GatewayPolicies:Authentication:RequireAuthenticatedUserByDefault") ?? true;

var bookingRateLimitPath =
    builder.Configuration["GatewayPolicies:RateLimiting:Booking:Path"] ?? "/api/appointment/book";

var bookingRateLimitMethod =
    builder.Configuration["GatewayPolicies:RateLimiting:Booking:Method"] ?? HttpMethods.Post;

var bookingPermitLimit =
    builder.Configuration.GetValue<int?>("GatewayPolicies:RateLimiting:Booking:PermitLimit") ?? 5;

var bookingWindowMinutes =
    builder.Configuration.GetValue<int?>("GatewayPolicies:RateLimiting:Booking:WindowMinutes") ?? 1;

var bookingRejectionStatusCode =
    builder.Configuration.GetValue<int?>("GatewayPolicies:RateLimiting:Booking:RejectionStatusCode")
    ?? StatusCodes.Status429TooManyRequests;

// -------------------- JWT Configuration --------------------
var jwtSecret = builder.Configuration["Jwt:Secret"];

if (string.IsNullOrWhiteSpace(jwtSecret))
{
    if (builder.Environment.IsDevelopment())
    {
        jwtSecret = "DEV_ONLY_SECRET_CHANGE_ME_MIN_32_CHARS_X";
        Console.WriteLine("WARNING: Jwt:Secret is not configured. Using a development-only fallback.");
    }
    else
    {
        throw new InvalidOperationException(
            "Jwt:Secret configuration is required. Set it via environment variable or secret store.");
    }
}

// Ensure minimum length
if (Encoding.UTF8.GetByteCount(jwtSecret) < 32)
{
    throw new InvalidOperationException("Jwt:Secret must be at least 32 bytes long.");
}

// Prevent insecure placeholder in production
if (!builder.Environment.IsDevelopment() &&
    string.Equals(jwtSecret, "CHANGE_ME_USE_ENV_VAR_IN_PRODUCTION_MIN_32_CHARS", StringComparison.Ordinal))
{
    throw new InvalidOperationException("JWT signing key is using an insecure placeholder value.");
}

// -------------------- Authentication --------------------
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

// -------------------- Authorization --------------------
builder.Services.AddAuthorization(options =>
{
    if (requireAuthByDefault)
    {
        options.FallbackPolicy = new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .Build();
    }

    options.AddPolicy("allow-anonymous-route", policy =>
    {
        policy.RequireAssertion(_ => true);
    });
});

// -------------------- Rate Limiting --------------------
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = bookingRejectionStatusCode;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var isBookingEndpoint =
            string.Equals(context.Request.Method, bookingRateLimitMethod, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(context.Request.Path.Value, bookingRateLimitPath, StringComparison.OrdinalIgnoreCase);

        if (!isBookingEndpoint)
        {
            return RateLimitPartition.GetNoLimiter("non-booking");
        }

        // Extract client IP safely
        var xForwardedFor = context.Request.Headers["X-Forwarded-For"].ToString();
        string? clientIp;

        if (!string.IsNullOrWhiteSpace(xForwardedFor))
        {
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

// -------------------- CORS --------------------
var frontendOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { builder.Configuration["Cors:FrontendOrigin"] ?? "http://localhost:5173" };

static bool IsAllowedCorsOrigin(string origin, IEnumerable<string> configuredOrigins)
{
    if (string.IsNullOrWhiteSpace(origin)) return false;

    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;

    if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
        && !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    var normalizedOrigin = $"{uri.Scheme}://{uri.Host}{(uri.IsDefaultPort ? "" : $":{uri.Port}")}";

    foreach (var configured in configuredOrigins)
    {
        if (string.IsNullOrWhiteSpace(configured)) continue;

        var normalizedConfigured = configured.Trim().TrimEnd('/');
        if (string.Equals(normalizedOrigin, normalizedConfigured, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }
    }

    if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
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

// -------------------- Pipeline --------------------
var app = builder.Build();

app.UseForwardedHeaders();

// Custom middleware (logging + error handling)
app.UseMiddleware<RequestContextLoggingMiddleware>();
app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => "Healthy").AllowAnonymous();

app.MapReverseProxy();

app.Run();