using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Prometheus;
using QueueLanka.Identity.Data;
using QueueLanka.Identity.Services;
using QueueLanka.Shared.Filters;
using QueueLanka.Shared.Middleware;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>();
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "QueueLanka Identity API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "CHANGE_ME_USE_ENV_VAR_IN_PRODUCTION_MIN_32_CHARS";
var wso2Enabled = builder.Configuration.GetValue<bool?>("Wso2:Enabled") ?? false;
var wso2Authority = builder.Configuration["Wso2:Authority"]?.TrimEnd('/');
var wso2Audience = builder.Configuration["Wso2:Audience"]
    ?? builder.Configuration["Wso2:ClientId"]
    ?? builder.Configuration["Jwt:Audience"]
    ?? "queuelanka-client";
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
            ValidIssuer              = builder.Configuration["Jwt:Issuer"] ?? "queuelanka-api",
            ValidAudience            = builder.Configuration["Jwt:Audience"] ?? "queuelanka-client",
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            RoleClaimType            = ClaimTypes.Role,
            ClockSkew                = TimeSpan.Zero
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
                ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "queuelanka-api",
                ValidAudience = builder.Configuration["Jwt:Audience"] ?? "queuelanka-client",
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

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IEmailVerificationRepository, EmailVerificationRepository>();

builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<IEmailVerificationService, EmailVerificationService>();
builder.Services.AddHttpClient<IWso2IdentityService, Wso2IdentityService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();

builder.Services.AddHealthChecks();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseMiddleware<RequestContextLoggingMiddleware>();
app.UseMiddleware<ExceptionMiddleware>();
app.UseHttpMetrics();
app.MapGet("/", () => Results.Ok(new
{
    service = "QueueLanka Identity",
    status = "Healthy"
})).AllowAnonymous();
app.MapHealthChecks("/health");
app.MapMetrics("/metrics").AllowAnonymous();

app.UseSwagger();
app.UseSwaggerUI();

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
