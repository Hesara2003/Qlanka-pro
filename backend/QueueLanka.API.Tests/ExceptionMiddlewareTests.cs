using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Middleware;

namespace QueueLanka.API.Tests;

public class ExceptionMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_AppException_ReturnsMappedStatusAndBody()
    {
        // Arrange
        var appException = new AppException(422, "INVALID_ROLE", "Role is invalid.");
        var middleware = BuildMiddleware(
            _ => throw appException,
            Environments.Production);

        var context = BuildContext("/api/auth/register");

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(422);
        context.Response.ContentType.Should().Be("application/json");

        var payload = await ReadJsonAsync(context);
        payload.GetProperty("success").GetBoolean().Should().BeFalse();
        payload.GetProperty("code").GetString().Should().Be("INVALID_ROLE");
        payload.GetProperty("message").GetString().Should().Be("Role is invalid.");
        payload.GetProperty("path").GetString().Should().Be("/api/auth/register");
        payload.GetProperty("details").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task InvokeAsync_UnexpectedException_ReturnsInternalError()
    {
        // Arrange
        var middleware = BuildMiddleware(
            _ => throw new InvalidOperationException("boom"),
            Environments.Production);

        var context = BuildContext("/api/appointments/book");

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(500);

        var payload = await ReadJsonAsync(context);
        payload.GetProperty("code").GetString().Should().Be("INTERNAL_ERROR");
        payload.GetProperty("message").GetString().Should().Be("An unexpected error occurred. Please try again later.");
        payload.GetProperty("details").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task InvokeAsync_DevelopmentEnvironment_IncludesUnhandledExceptionDetails()
    {
        // Arrange
        var middleware = BuildMiddleware(
            _ => throw new Exception("broken"),
            Environments.Development);

        var context = BuildContext("/api/test");

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var payload = await ReadJsonAsync(context);
        payload.GetProperty("details").ValueKind.Should().Be(JsonValueKind.Object);

        var details = payload.GetProperty("details");
        details.GetProperty("exceptionType").GetString().Should().Be("Exception");
    }

    [Fact]
    public async Task InvokeAsync_AppExceptionWithData_InDevelopment_UsesCustomDataAsDetails()
    {
        // Arrange
        var appException = new AppException(409, "DUPLICATE", "Duplicate value.");
        appException.Data["field"] = "username";
        appException.Data["value"] = "john";

        var middleware = BuildMiddleware(
            _ => throw appException,
            Environments.Development);

        var context = BuildContext("/api/users");

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var payload = await ReadJsonAsync(context);
        var details = payload.GetProperty("details");
        details.GetProperty("field").GetString().Should().Be("username");
        details.GetProperty("value").GetString().Should().Be("john");
    }

    [Fact]
    public async Task InvokeAsync_NoException_InvokesNextAndKeepsStatusCode()
    {
        // Arrange
        var nextWasCalled = false;
        var middleware = BuildMiddleware(
            _ =>
            {
                nextWasCalled = true;
                return Task.CompletedTask;
            },
            Environments.Production);

        var context = BuildContext("/api/health");

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        nextWasCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    private static ExceptionMiddleware BuildMiddleware(RequestDelegate next, string environmentName)
    {
        var logger = new Mock<ILogger<ExceptionMiddleware>>();
        var env = new Mock<IWebHostEnvironment>();
        env.Setup(e => e.EnvironmentName).Returns(environmentName);

        return new ExceptionMiddleware(next, logger.Object, env.Object);
    }

    private static DefaultHttpContext BuildContext(string path)
    {
        var context = new DefaultHttpContext();
        context.TraceIdentifier = "trace-123";
        context.Request.Path = path;
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var text = await reader.ReadToEndAsync();
        using var doc = JsonDocument.Parse(text);
        return doc.RootElement.Clone();
    }
}
