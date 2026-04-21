using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Prometheus;
using QueueLanka.API.Data;
using QueueLanka.API.Filters;
using QueueLanka.API.Middleware;
using QueueLanka.API.Services;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers with validation filter (SCRUM-29) ─────────────
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>();
});

// ── Swagger ───────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "QueueLanka API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Enter your JWT token."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ── JWT Authentication ─────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "queuelanka-api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "queuelanka-client";
var wso2Enabled = builder.Configuration.GetValue<bool?>("Wso2:Enabled") ?? false;
var wso2Authority = builder.Configuration["Wso2:Authority"]?.TrimEnd('/');
var wso2Audience = builder.Configuration["Wso2:Audience"]
    ?? builder.Configuration["Wso2:ClientId"]
    ?? jwtAudience;
var wso2RequireHttpsMetadata = builder.Configuration.GetValue<bool?>("Wso2:RequireHttpsMetadata") ?? true;
var wso2AllowInvalidCertificate = builder.Configuration.GetValue<bool?>("Wso2:AllowInvalidCertificate") ?? false;
var wso2ValidIssuer = builder.Configuration["Wso2:ValidIssuer"];

if (wso2Enabled && string.IsNullOrWhiteSpace(wso2Authority))
{
    throw new InvalidOperationException("Wso2:Authority must be configured when Wso2:Enabled is true.");
}

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "DynamicJwt";
        options.DefaultChallengeScheme = "DynamicJwt";
    })
    .AddPolicyScheme("DynamicJwt", "Dynamic JWT scheme", options =>
    {
        options.ForwardDefaultSelector = context =>
        {
            var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
            var token = ExtractBearerToken(authHeader);

            if (!string.IsNullOrWhiteSpace(token) && LooksLikeWso2Token(token, wso2ValidIssuer))
            {
                return "Wso2Jwt";
            }

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
            RoleClaimType            = ClaimTypes.Role,
            ClockSkew                = TimeSpan.Zero
        };

        // ── Custom 401 / 403 JSON responses ───────────────────
        options.Events = new JwtBearerEvents
        {
            // Fires when a protected endpoint is accessed without a valid token
            OnChallenge = async context =>
            {
                context.HandleResponse(); // suppress default WWW-Authenticate header response

                context.Response.StatusCode  = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";

                var (code, message) = string.IsNullOrWhiteSpace(
                    context.Request.Headers.Authorization.FirstOrDefault())
                    ? ("TOKEN_MISSING",  "Authorization token is required.")
                    : ("TOKEN_INVALID",  "Token is invalid or has expired.");

                await context.Response.WriteAsync(
                    $$"""{"code":"{{code}}","message":"{{message}}"}""");
            },

            // Fires when a valid token lacks the required role/policy
            OnForbidden = async context =>
            {
                context.Response.StatusCode  = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    """{"code":"FORBIDDEN","message":"You do not have permission to access this resource."}""");
            }
        };
    })
    .AddJwtBearer("Wso2Jwt", options =>
    {
        if (!wso2Enabled)
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                RoleClaimType = ClaimTypes.Role,
                ClockSkew = TimeSpan.Zero
            };
            return;
        }

        options.Authority = wso2Authority;
        options.RequireHttpsMetadata = wso2RequireHttpsMetadata;
        options.MapInboundClaims = false;

        if (wso2AllowInvalidCertificate)
        {
            options.BackchannelHttpHandler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            };
        }

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = string.IsNullOrWhiteSpace(wso2ValidIssuer) ? null : wso2ValidIssuer,
            ValidAudience = wso2Audience,
            RoleClaimType = "role",
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ── Dependency Injection ───────────────────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IEmailVerificationRepository, EmailVerificationRepository>();
builder.Services.AddScoped<IServiceCenterRepository, ServiceCenterRepository>();
builder.Services.AddScoped<IAppointmentRepository, AppointmentRepository>();
builder.Services.AddScoped<ITokenRepository, TokenRepository>();

builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<IEmailVerificationService, EmailVerificationService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IServiceCenterService, ServiceCenterService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();

// ── Health checks ─────────────────────────────────────────────
builder.Services.AddHealthChecks();

// ── CORS (development) ────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// ── Middleware pipeline ────────────────────────────────────────
app.UseMiddleware<RequestContextLoggingMiddleware>();
app.UseMiddleware<ExceptionMiddleware>();
app.UseHttpMetrics();

// Health check endpoint (used by CI/CD deployment verification)
app.MapHealthChecks("/health");
app.MapMetrics("/metrics").AllowAnonymous();

app.UseSwagger();
app.UseSwaggerUI();

if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

static string? ExtractBearerToken(string? authHeader)
{
    if (string.IsNullOrWhiteSpace(authHeader))
    {
        return null;
    }

    const string bearerPrefix = "Bearer ";
    return authHeader.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase)
        ? authHeader[bearerPrefix.Length..].Trim()
        : null;
}

static bool LooksLikeWso2Token(string token, string? configuredIssuer)
{
    var payload = TryReadJwtPayload(token);
    if (payload is null)
    {
        return false;
    }

    if (!string.IsNullOrWhiteSpace(configuredIssuer)
        && payload.TryGetValue("iss", out var issuer)
        && string.Equals(issuer, configuredIssuer, StringComparison.OrdinalIgnoreCase))
    {
        return true;
    }

    return payload.ContainsKey("azp") && payload.ContainsKey("client_id");
}

static Dictionary<string, string>? TryReadJwtPayload(string token)
{
    try
    {
        var parts = token.Split('.');
        if (parts.Length < 2)
        {
            return null;
        }

        var padded = parts[1]
            .Replace('-', '+')
            .Replace('_', '/');

        padded = padded.PadRight(padded.Length + ((4 - padded.Length % 4) % 4), '=');

        var json = Encoding.UTF8.GetString(Convert.FromBase64String(padded));
        var dictionary = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
        if (dictionary is null)
        {
            return null;
        }

        var payload = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var entry in dictionary)
        {
            payload[entry.Key] = entry.Value.ToString();
        }

        return payload;
    }
    catch
    {
        return null;
    }
}
