// QueueLanka.API.Tests/CounterControllerTests.cs
// NOTE: These tests target the CounterController in the QueueLanka.Queue microservice.
// The test project references QueueLanka.API, so we reference the Queue controller directly.
// To compile, add a ProjectReference to QueueLanka.Queue in QueueLanka.API.Tests.csproj if not already present.

using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using QueueLanka.Queue.Controllers;
using QueueLanka.Queue.DTOs.Counter;
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
        SetAuthenticatedUser(role, userId: "99");
    }

    private void SetAuthenticatedUser(string role, string userId)
    {
        var claims = new List<System.Security.Claims.Claim>
        {
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, userId),
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

    [Fact]
    public async Task UpdateTokenStatus_ValidServedRequest_ReturnsOk()
    {
        var updated = new UpdateTokenStatusResponseDto
        {
            TokenId = 20,
            CenterId = 1,
            CounterId = 5,
            TokenNumber = "A020",
            Status = "served",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow.AddMinutes(-20),
            CalledAt = DateTime.UtcNow.AddMinutes(-10),
            ServedAt = DateTime.UtcNow
        };

        _mockCounterService
            .Setup(s => s.UpdateTokenStatusAsync(5, 20, "served"))
            .ReturnsAsync(updated);

        var request = new UpdateTokenStatusRequestDto { Status = "served" };

        var result = await _controller.UpdateTokenStatus(5, 20, request);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        _mockCounterService.Verify(s => s.UpdateTokenStatusAsync(5, 20, "served"), Times.Once);
    }

    [Fact]
    public async Task UpdateTokenStatus_TokenNotFound_Returns404()
    {
        _mockCounterService
            .Setup(s => s.UpdateTokenStatusAsync(5, 20, "served"))
            .ThrowsAsync(new KeyNotFoundException("Token not found"));

        var request = new UpdateTokenStatusRequestDto { Status = "served" };

        var result = await _controller.UpdateTokenStatus(5, 20, request);

        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task UpdateTokenStatus_CounterMismatch_Returns403()
    {
        _mockCounterService
            .Setup(s => s.UpdateTokenStatusAsync(5, 20, "skipped"))
            .ThrowsAsync(new UnauthorizedAccessException("Token does not belong to this counter"));

        var request = new UpdateTokenStatusRequestDto { Status = "skipped" };

        var result = await _controller.UpdateTokenStatus(5, 20, request);

        var forbiddenResult = result.Should().BeOfType<ObjectResult>().Subject;
        forbiddenResult.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task ReassignToken_ValidRequest_ReturnsOk()
    {
        var response = new ReassignTokenResponseDto
        {
            TokenId = 31,
            CenterId = 1,
            UserId = 42,
            TokenNumber = "A031",
            Status = "waiting",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow.AddMinutes(-12),
            QueuePosition = 1,
            SourceCounterId = 5,
            TargetCounterId = 7,
            ReassignedAt = DateTime.UtcNow
        };

        _mockCounterService
            .Setup(s => s.ReassignTokenAsync(5, 31, 7, "balance load", 99))
            .ReturnsAsync(response);

        var result = await _controller.ReassignToken(5, new ReassignTokenRequestDto
        {
            TokenId = 31,
            TargetCounterId = 7,
            Reason = "balance load"
        });

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task ReassignToken_InvalidUserIdClaim_Returns403()
    {
        SetAuthenticatedUser(role: "officer", userId: "not-a-number");

        var result = await _controller.ReassignToken(5, new ReassignTokenRequestDto
        {
            TokenId = 31,
            TargetCounterId = 7
        });

        var forbiddenResult = result.Should().BeOfType<ObjectResult>().Subject;
        forbiddenResult.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task GetDashboard_ValidOfficer_ReturnsOk()
    {
        _mockCounterService
            .Setup(s => s.GetDashboardAsync(5, 99))
            .ReturnsAsync(new CounterDashboardDto
            {
                CounterId = 5,
                CounterName = "Counter 5",
                IsOpen = true,
                ServedCount = 2,
                SkippedCount = 1,
                AverageServiceTimeSeconds = 40,
                WaitingTokens = new List<WaitingTokenDto>()
            });

        var result = await _controller.GetDashboard(5);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task GetWaitingTokens_ValidOfficer_ReturnsOk()
    {
        _mockCounterService
            .Setup(s => s.GetWaitingTokensAsync(5, 99))
            .ReturnsAsync(new List<WaitingTokenDto>
            {
                new() { TokenId = 10, TokenNumber = "A010", QueuePosition = 1 }
            });

        var result = await _controller.GetWaitingTokens(5);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task GetCounterStats_AdminRole_ReturnsOk()
    {
        SetAuthenticatedUser(role: "admin", userId: "99");

        _mockCounterService
            .Setup(s => s.GetDashboardAsync(5, 0))
            .ReturnsAsync(new CounterDashboardDto
            {
                CounterId = 5,
                CounterName = "Counter 5",
                IsOpen = true,
                ServedCount = 8,
                SkippedCount = 2,
                AverageServiceTimeSeconds = 35,
                WaitingTokens = new List<WaitingTokenDto>()
            });

        var result = await _controller.GetCounterStats(5);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task CreateCounter_AdminUser_ReturnsCreated()
    {
        SetAuthenticatedUser(role: "admin", userId: "99");

        _mockCounterService
            .Setup(s => s.CreateCounterAsync(It.Is<CreateCounterRequestDto>(r => r.CenterId == 2), 99))
            .ReturnsAsync(new CounterResponseDto
            {
                CounterId = 12,
                Name = "Counter X",
                CenterId = 2,
                CenterName = "Main Center",
                IsOpen = false,
                CreatedAt = DateTime.UtcNow
            });

        var result = await _controller.CreateCounter(2, new CreateCounterRequestDto { Name = "Counter X" });

        var createdResult = result.Should().BeOfType<CreatedResult>().Subject;
        createdResult.StatusCode.Should().Be(201);
    }

    [Fact]
    public async Task CreateCounter_InvalidUserIdClaim_Returns403()
    {
        SetAuthenticatedUser(role: "admin", userId: "invalid");

        var result = await _controller.CreateCounter(2, new CreateCounterRequestDto { Name = "Counter X" });

        var forbiddenResult = result.Should().BeOfType<ObjectResult>().Subject;
        forbiddenResult.StatusCode.Should().Be(403);
    }
}
