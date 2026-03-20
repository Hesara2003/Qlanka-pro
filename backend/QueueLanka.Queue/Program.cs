// backend/QueueLanka.Queue/Program.cs

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.Events;
using QueueLanka.Queue.Hubs;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.Events;
using QueueLanka.Shared.Filters;
using QueueLanka.Shared.Middleware;
using QueueLanka.Queue.Integration;
using System.Text;

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

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "CHANGE_ME_USE_ENV_VAR_IN_PRODUCTION_MIN_32_CHARS";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
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
            ClockSkew                = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddScoped<IAppointmentRepository, AppointmentRepository>();
builder.Services.AddScoped<ITokenRepository, TokenRepository>();
builder.Services.AddScoped<ICounterRepository, CounterRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IServiceCenterClient, ServiceCenterClient>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ICounterService, CounterService>();
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(frontendOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

var app = builder.Build();

var eventBus = app.Services.GetRequiredService<IEventBus>();
eventBus.Subscribe<TokenCalledEvent, TokenCalledEventHandler>();

app.UseMiddleware<ExceptionMiddleware>();
app.MapHealthChecks("/health");

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
