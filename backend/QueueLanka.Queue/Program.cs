// backend/QueueLanka.Queue/Program.cs

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Prometheus;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.Events;
using QueueLanka.Queue.Hubs;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.Events;
using QueueLanka.Shared.Filters;
using QueueLanka.Shared.Middleware;
using QueueLanka.Queue.Integration;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>();
});

builder.Services.AddEndpointsApiExplorer();
builder.Services
    .AddSignalR(options =>
    {
        options.MaximumReceiveMessageSize = 64 * 1024;
        options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
        options.HandshakeTimeout = TimeSpan.FromSeconds(15);
        options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    });
// MessagePack is more bandwidth-efficient for high concurrency.
// This project currently uses JSON protocol by default because
// Microsoft.AspNetCore.SignalR.Protocols.MessagePack is not referenced.
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "QueueLanka Queue API", Version = "v1" });
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

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "queuelanka-api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "queuelanka-client";
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "CHANGE_ME_USE_ENV_VAR_IN_PRODUCTION_MIN_32_CHARS";

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

if (Encoding.UTF8.GetByteCount(jwtSecret) < 32)
{
    throw new InvalidOperationException("Jwt:Secret must be at least 32 bytes long.");
}

builder.Services.AddAuthentication(options =>
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

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireAssertion(context =>
            context.User.Claims.Any(claim =>
                (string.Equals(claim.Type, ClaimTypes.Role, StringComparison.OrdinalIgnoreCase)
                 || string.Equals(claim.Type, "role", StringComparison.OrdinalIgnoreCase)
                 || string.Equals(claim.Type, "roles", StringComparison.OrdinalIgnoreCase)
                 || string.Equals(claim.Type, "http://schemas.microsoft.com/ws/2008/06/identity/claims/role", StringComparison.OrdinalIgnoreCase))
                && string.Equals(claim.Value, "admin", StringComparison.OrdinalIgnoreCase))));
    options.AddPolicy("OfficerOnly", policy => policy.RequireRole("officer"));
    options.AddPolicy("AdminOrOfficer", policy => policy.RequireRole("admin", "officer"));
});

builder.Services.AddScoped<IAppointmentRepository, AppointmentRepository>();
builder.Services.AddScoped<ITokenRepository, TokenRepository>();
builder.Services.AddScoped<ICounterRepository, CounterRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IServiceCenterClient, ServiceCenterClient>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ICounterService>(sp => new CounterService(
    sp.GetRequiredService<ICounterRepository>(),
    sp.GetRequiredService<ITokenRepository>(),
    sp.GetRequiredService<IAuditLogRepository>(),
    sp.GetRequiredService<IEventBus>(),
    sp.GetRequiredService<IQueueBroadcastService>(),
    sp.GetRequiredService<ILogger<CounterService>>(),
    sp.GetService<IServiceCenterClient>()));
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IQueueBroadcastService, QueueBroadcastService>();
builder.Services.AddSingleton<IEventBus, InMemoryEventBus>();
builder.Services.AddTransient<TokenCalledEventHandler>();

// We need an HttpClient for ServiceCenter
builder.Services.AddHttpClient("ServiceCenter", client => 
{
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:ServiceCenter"] ?? "http://service-center:80/");
});

builder.Services.AddHealthChecks();

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

var eventBus = app.Services.GetRequiredService<IEventBus>();
eventBus.Subscribe<TokenCalledEvent, TokenCalledEventHandler>();

app.UseMiddleware<RequestContextLoggingMiddleware>();
app.UseMiddleware<ExceptionMiddleware>();
app.UseHttpMetrics();
app.MapGet("/", () => Results.Ok(new
{
    service = "QueueLanka Queue",
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
// QueueHub supports queue-{centerId} and counter-{counterId} group subscriptions.
// For >50 concurrent clients in production, use Azure SignalR Service
// or a Redis backplane for horizontal scaling across multiple instances.
app.MapHub<QueueHub>("/hubs/queue");

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

public partial class Program { }

internal sealed class TokenCalledEventHandler : IIntegrationEventHandler<TokenCalledEvent>
{
    private readonly IQueueBroadcastService _queueBroadcastService;
    private readonly ILogger<TokenCalledEventHandler> _logger;

    public TokenCalledEventHandler(
        IQueueBroadcastService queueBroadcastService,
        ILogger<TokenCalledEventHandler> logger)
    {
        _queueBroadcastService = queueBroadcastService;
        _logger = logger;
    }

    public async Task HandleAsync(TokenCalledEvent @event)
    {
        var groupName = QueueHub.GetCenterGroupName(@event.CenterId);
        await _queueBroadcastService.BroadcastTokenCalled(@event);

        _logger.LogInformation(
            "Broadcasted TokenCalledEvent for token {TokenId} to group {GroupName}",
            @event.TokenId,
            groupName);
    }
}
