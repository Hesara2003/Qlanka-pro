using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    if (builder.Environment.IsDevelopment())
    {
        jwtSecret = "DEV_ONLY_SECRET_CHANGE_ME_MIN_32_CHARS_X";
        Console.WriteLine("WARNING: Jwt:Secret is not configured. Using an insecure development-only fallback. " +
                          "Set Jwt:Secret via environment variable or user secrets before deploying.");
    }
    else
    {
        throw new InvalidOperationException(
            "Jwt:Secret configuration is required. Set it via an environment variable or secret store.");
    }
}

if (Encoding.UTF8.GetByteCount(jwtSecret) < 32)
{
    throw new InvalidOperationException("Jwt:Secret must be at least 32 bytes long.");
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
    // Enforce authentication by default for all endpoints unless explicitly marked anonymous.
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    // Allow reverse proxy routes to opt into anonymous (unauthenticated) access via
    // AuthorizationPolicy: "anonymous" in appsettings.json. Routes using this policy
    // must not require authentication; downstream services should implement their own
    // authorization if needed (e.g. /api/auth/** login/register endpoints).
    options.AddPolicy("anonymous", policy =>
    {
        policy.RequireAssertion(_ => true);
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
app.UseAuthentication();
app.UseAuthorization();

// Map health check
app.MapGet("/health", () => "Healthy").AllowAnonymous();

app.MapReverseProxy();

app.Run();
