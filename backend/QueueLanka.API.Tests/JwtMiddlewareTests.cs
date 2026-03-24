using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Moq;
using QueueLanka.API.Middleware;

namespace QueueLanka.API.Tests;

public class JwtMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WithoutAuthorizationHeader_CallsNext()
    {
        // Arrange
        var middleware = BuildMiddleware();
        var context = new DefaultHttpContext();

        var nextCalled = false;
        middleware = BuildMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task InvokeAsync_InvalidBearerToken_Returns401AndShortCircuits()
    {
        // Arrange
        var nextCalled = false;
        var middleware = BuildMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        context.Request.Headers.Authorization = "Bearer invalid.token.value";

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        nextCalled.Should().BeFalse();
        context.Response.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
        context.Response.ContentType.Should().Be("application/json");

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();
        body.Should().Contain("TOKEN_INVALID");
    }

    [Fact]
    public async Task InvokeAsync_ValidBearerToken_AttachesUserAndCallsNext()
    {
        // Arrange
        var nextCalled = false;
        var middleware = BuildMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        var token = GenerateValidToken();
        var context = new DefaultHttpContext();
        context.Request.Headers.Authorization = $"Bearer {token}";

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value.Should().Be("123");
    }

    private static JwtMiddleware BuildMiddleware(RequestDelegate? next = null)
    {
        var values = new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = "this-is-a-very-long-secret-for-tests-123456789",
            ["Jwt:Issuer"] = "qlanka-tests",
            ["Jwt:Audience"] = "qlanka-clients"
        };

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();

        var logger = new Mock<ILogger<JwtMiddleware>>();

        return new JwtMiddleware(next ?? (_ => Task.CompletedTask), config, logger.Object);
    }

    private static string GenerateValidToken()
    {
        var secret = "this-is-a-very-long-secret-for-tests-123456789";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));

        var token = new JwtSecurityToken(
            issuer: "qlanka-tests",
            audience: "qlanka-clients",
            claims:
            [
                new Claim(ClaimTypes.NameIdentifier, "123"),
                new Claim(ClaimTypes.Role, "citizen")
            ],
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
