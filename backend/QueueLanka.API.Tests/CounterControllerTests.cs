// QueueLanka.API.Tests/CounterControllerTests.cs
// NOTE: These tests target the CounterController in the QueueLanka.Queue microservice.
// The test project references QueueLanka.API, so we reference the Queue controller directly.
// To compile, add a ProjectReference to QueueLanka.Queue in QueueLanka.API.Tests.csproj if not already present.

using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using QueueLanka.Queue.Controllers;
using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.Services;

namespace QueueLanka.API.Tests;

public class CounterControllerTests
{
    private readonly Mock<ICounterService> _mockCounterService;
    private readonly CounterController    _controller;

    public CounterControllerTests()
    {
        _mockCounterService = new Mock<ICounterService>();
        _controller         = new CounterController(_mockCounterService.Object);

        // Default: authenticated officer
        SetAuthenticatedUser(role: "officer");
    }

    // ────────────────────── Helper Methods ──────────────────────

    private void SetAuthenticatedUser(string role = "officer")
    {
        var claims = new List<System.Security.Claims.Claim>
        {
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "99"),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, role)
        };
        var identity  = new System.Security.Claims.ClaimsIdentity(claims, "TestAuth");
        var principal = new System.Security.Claims.ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext { User = principal };
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    // ────────────────────── CallNext Tests ──────────────────────

    [Fact]
    public async Task CallNext_NextTokenFound_ReturnsOkWithTokenDetails()
    {
        // Arrange
        var calledToken = new CallNextTokenResponseDto
        {
            TokenId     = 1,
            CenterId    = 10,
            CounterId   = 5,
            UserId      = 42,
            TokenNumber = "A001",
            IssuedDate  = DateTime.UtcNow.Date,
            Status      = "Called",
            IssuedTime  = DateTime.UtcNow.AddHours(-1),
            CalledAt    = DateTime.UtcNow
        };

        _mockCounterService
            .Setup(s => s.CallNextTokenAsync(5))
            .ReturnsAsync(calledToken);

        // Act
        var result = await _controller.CallNext(5);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        // Verify the service was called exactly once with the correct counter ID
        _mockCounterService.Verify(s => s.CallNextTokenAsync(5), Times.Once);
    }

    [Fact]
    public async Task CallNext_NoWaitingTokens_Returns404NotFound()
    {
        // Arrange — service returns null when no waiting tokens exist today
        _mockCounterService
            .Setup(s => s.CallNextTokenAsync(5))
            .ReturnsAsync((CallNextTokenResponseDto?)null);

        // Act
        var result = await _controller.CallNext(5);

        // Assert
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task CallNext_CounterClosed_Returns400BadRequest()
    {
        // Arrange — service throws when counter is closed or does not exist
        _mockCounterService
            .Setup(s => s.CallNextTokenAsync(5))
            .ThrowsAsync(new InvalidOperationException("Counter is closed or does not exist."));

        // Act
        var result = await _controller.CallNext(5);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.StatusCode.Should().Be(400);
    }
}
