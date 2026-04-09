using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Prometheus;
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

// ── JWT / WSO2 IS configuration ──────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"];
var jwtIssuer   = builder.Configuration["Jwt:Issuer"]   ?? "queuelanka-api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "queuelanka-client";

if (string.IsNullOrWhiteSpace(jwtSecret))
{
    jwtSecret = "CHANGE_ME_USE_ENV_VAR_IN_PRODUCTION_MIN_32_CHARS";
    Console.WriteLine("WARNING: Jwt:Secret is not configured. Using fallback signing key. Configure Jwt__Secret immediately.");
}

if (Encoding.UTF8.GetByteCount(jwtSecret) < 32)
    throw new InvalidOperationException("Jwt:Secret must be at least 32 bytes long.");

var wso2Enabled                 = builder.Configuration.GetValue<bool?>("Wso2:Enabled") ?? false;
var wso2Authority               = builder.Configuration["Wso2:Authority"]?.TrimEnd('/');
var wso2Audience                = builder.Configuration["Wso2:Audience"]
                                  ?? builder.Configuration["Wso2:ClientId"]
                                  ?? jwtAudience;
var wso2RequireHttpsMetadata    = builder.Configuration.GetValue<bool?>("Wso2:RequireHttpsMetadata") ?? true;
var wso2AllowInvalidCertificate = builder.Configuration.GetValue<bool?>("Wso2:AllowInvalidCertificate") ?? false;
var wso2ValidIssuer             = builder.Configuration["Wso2:ValidIssuer"];

if (wso2Enabled && string.IsNullOrWhiteSpace(wso2Authority))
    throw new InvalidOperationException("Wso2:Authority must be configured when Wso2:Enabled is true.");

// ── Authentication: dual-scheme (local fallback + WSO2 JWKS) ─────────────
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "DynamicJwt";
        options.DefaultChallengeScheme    = "DynamicJwt";
    })
    .AddPolicyScheme("DynamicJwt", "Dynamic JWT scheme", options =>
    {
        options.ForwardDefaultSelector = context =>
        {
            var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
            var token = ExtractBearerToken(authHeader);
            if (!string.IsNullOrWhiteSpace(token) && LooksLikeWso2Token(token, wso2ValidIssuer))
                return "Wso2Jwt";
            return "LocalJwt";
        };
    })
    .AddJwtBearer("LocalJwt", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtAudience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew                = TimeSpan.Zero
        };
    })
    .AddJwtBearer("Wso2Jwt", options =>
    {
        if (!wso2Enabled)
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidateAudience         = true,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer              = jwtIssuer,
                ValidAudience            = jwtAudience,
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ClockSkew                = TimeSpan.Zero
            };
            return;
        }

        options.Authority            = wso2Authority;
        options.RequireHttpsMetadata = wso2RequireHttpsMetadata;
        options.MapInboundClaims     = false;

        if (wso2AllowInvalidCertificate)
        {
            options.BackchannelHttpHandler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            };
        }

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = string.IsNullOrWhiteSpace(wso2ValidIssuer) ? null : wso2ValidIssuer,
            ValidAudience            = wso2Audience,
            RoleClaimType            = "role",
            ClockSkew                = TimeSpan.Zero
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

    options.AddPolicy("public-access", policy =>
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
app.UseHttpMetrics();

app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new
{
    service = "QueueLanka Gateway",
    status = "Healthy"
})).AllowAnonymous();

app.MapGet("/health", () => "Healthy").AllowAnonymous();
app.MapMetrics("/metrics").AllowAnonymous();

app.MapReverseProxy();

app.Run();

// ── Helpers ───────────────────────────────────────────────────────────────

static string? ExtractBearerToken(string? authHeader)
{
    if (string.IsNullOrWhiteSpace(authHeader)) return null;
    const string prefix = "Bearer ";
    return authHeader.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
        ? authHeader[prefix.Length..].Trim()
        : null;
}

static bool LooksLikeWso2Token(string token, string? configuredIssuer)
{
    var payload = TryReadJwtPayload(token);
    if (payload is null) return false;

    if (!string.IsNullOrWhiteSpace(configuredIssuer)
        && payload.TryGetValue("iss", out var issuer)
        && string.Equals(issuer, configuredIssuer, StringComparison.OrdinalIgnoreCase))
    {
        return true;
    }

    return payload.ContainsKey("azp");
}

static Dictionary<string, string>? TryReadJwtPayload(string token)
{
    try
    {
        var parts = token.Split('.');
        if (parts.Length < 2) return null;

        var padded = parts[1].Replace('-', '+').Replace('_', '/');
        padded = padded.PadRight(padded.Length + ((4 - padded.Length % 4) % 4), '=');

        var json = Encoding.UTF8.GetString(Convert.FromBase64String(padded));
        var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
        if (dict is null) return null;

        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var kv in dict)
            result[kv.Key] = kv.Value.ToString();
        return result;
    }
    catch
    {
        return null;
    }
}