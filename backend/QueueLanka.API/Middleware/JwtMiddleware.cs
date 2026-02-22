using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace QueueLanka.API.Middleware;

/// <summary>
/// Extracts and validates the JWT Bearer token on every request.
/// - Missing token  → continues without a ClaimsPrincipal (endpoints with [Authorize] will 401 via OnChallenge).
/// - Invalid token  → short-circuits with 401 TOKEN_INVALID immediately.
/// - Valid token    → attaches ClaimsPrincipal to HttpContext.User and continues.
/// </summary>
public class JwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _config;
    private readonly ILogger<JwtMiddleware> _logger;

    public JwtMiddleware(RequestDelegate next, IConfiguration config, ILogger<JwtMiddleware> logger)
    {
        _next   = next;
        _config = config;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var token = ExtractBearerToken(context);

        if (token is not null)
        {
            var principal = ValidateToken(token);

            if (principal is null)
            {
                // Token was present but failed validation (expired, tampered, wrong issuer, etc.)
                _logger.LogWarning("JWT validation failed for token on {Path}", context.Request.Path);
                context.Response.StatusCode  = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    """{"code":"TOKEN_INVALID","message":"Token is invalid or has expired."}""");
                return;
            }

            // Attach the validated principal so [Authorize] and User.Claims work downstream
            context.User = principal;
        }

        // No token present — let the authorization middleware emit 401 via OnChallenge
        await _next(context);
    }

    // ── Private helpers ────────────────────────────────────────

    private static string? ExtractBearerToken(HttpContext context)
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(authHeader) ||
            !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return null;

        return authHeader["Bearer ".Length..].Trim();
    }

    private System.Security.Claims.ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var secret   = _config["Jwt:Secret"]!;
            var issuer   = _config["Jwt:Issuer"];
            var audience = _config["Jwt:Audience"];

            var handler    = new JwtSecurityTokenHandler();
            var parameters = new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidateAudience         = true,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer              = issuer,
                ValidAudience            = audience,
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ClockSkew                = TimeSpan.Zero
            };

            return handler.ValidateToken(token, parameters, out _);
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogDebug(ex, "Security token validation failed");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during token validation");
            return null;
        }
    }
}
