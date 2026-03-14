using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QueueLanka.API.Data;
using QueueLanka.API.Filters;
using QueueLanka.API.Middleware;
using QueueLanka.API.Services;
using System.Text;

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

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
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
        policy.SetIsOriginAllowed(origin => true) // Allow any localhost/127.0.0.1 port for local dev
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// ── Middleware pipeline ────────────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();

// Health check endpoint (used by CI/CD deployment verification)
app.MapHealthChecks("/health");

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
