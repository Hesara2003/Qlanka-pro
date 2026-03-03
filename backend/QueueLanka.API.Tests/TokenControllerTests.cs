using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using QueueLanka.API.Controllers;
using QueueLanka.API.DTOs.Token;
using QueueLanka.API.Services;
using System.Security.Claims;

namespace QueueLanka.API.Tests;

public class TokenControllerTests
{
    private readonly Mock<ITokenService> _mockTokenService;
    private readonly TokenController _controller;

    public TokenControllerTests()
    {
        _mockTokenService = new Mock<ITokenService>();
        _controller = new TokenController(_mockTokenService.Object);

        // Default: authenticated user
        SetAuthenticatedUser(1);
    }

    // ────────────────────── Helper Methods ──────────────────────

    private void SetAuthenticatedUser(int userId, string role = "citizen")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext { User = principal };
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    private void SetUnauthenticatedUser()
    {
        var httpContext = new DefaultHttpContext { User = new ClaimsPrincipal() };
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    // ────────────────────── GetMyTokens Tests ──────────────────────

    [Fact]
    public async Task GetMyTokens_AuthenticatedUser_ReturnsOkWithTokens()
    {
        // Arrange
        var tokens = new List<UserTokenResponseDto>
        {
            new UserTokenResponseDto { TokenId = 1, TokenNumber = "T001", Status = "Waiting" },
            new UserTokenResponseDto { TokenId = 2, TokenNumber = "T002", Status = "Completed" }
        };
        _mockTokenService
            .Setup(s => s.GetUserTokensAsync(1))
            .ReturnsAsync(tokens);

        // Act
        var result = await _controller.GetMyTokens();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task GetMyTokens_UnauthenticatedUser_ReturnsUnauthorized()
    {
        // Arrange
        SetUnauthenticatedUser();

        // Act
        var result = await _controller.GetMyTokens();

        // Assert
        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task GetMyTokens_NoTokens_ReturnsOkWithEmptyList()
    {
        // Arrange
        _mockTokenService
            .Setup(s => s.GetUserTokensAsync(1))
            .ReturnsAsync(new List<UserTokenResponseDto>());

        // Act
        var result = await _controller.GetMyTokens();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    // ────────────────────── CancelMyToken Tests ──────────────────────

    [Fact]
    public async Task CancelMyToken_Success_ReturnsOk()
    {
        // Arrange
        _mockTokenService
            .Setup(s => s.CancelTokenAsync(10, 1, false))
            .ReturnsAsync(CancellationResult.Success);

        // Act
        var result = await _controller.CancelMyToken(10);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task CancelMyToken_UnauthenticatedUser_ReturnsUnauthorized()
    {
        // Arrange
        SetUnauthenticatedUser();

        // Act
        var result = await _controller.CancelMyToken(10);

        // Assert
        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task CancelMyToken_AlreadyCancelled_ReturnsConflict()
    {
        // Arrange
        _mockTokenService
            .Setup(s => s.CancelTokenAsync(10, 1, false))
            .ReturnsAsync(CancellationResult.AlreadyCancelled);

        // Act
        var result = await _controller.CancelMyToken(10);

        // Assert
        var conflictResult = result.Should().BeOfType<ConflictObjectResult>().Subject;
        conflictResult.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task CancelMyToken_NotCancellable_ReturnsUnprocessableEntity()
    {
        // Arrange
        _mockTokenService
            .Setup(s => s.CancelTokenAsync(10, 1, false))
            .ReturnsAsync(CancellationResult.NotCancellable);

        // Act
        var result = await _controller.CancelMyToken(10);

        // Assert
        var unprocessableResult = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
        unprocessableResult.StatusCode.Should().Be(422);
    }

    [Fact]
    public async Task CancelMyToken_TokenNotFound_ReturnsNotFound()
    {
        // Arrange
        _mockTokenService
            .Setup(s => s.CancelTokenAsync(10, 1, false))
            .ReturnsAsync(CancellationResult.TokenNotFound);

        // Act
        var result = await _controller.CancelMyToken(10);

        // Assert
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task CancelMyToken_AdminUser_PassesIsAdminTrue()
    {
        // Arrange
        SetAuthenticatedUser(1, "admin");
        _mockTokenService
            .Setup(s => s.CancelTokenAsync(10, 1, true))
            .ReturnsAsync(CancellationResult.Success);

        // Act
        var result = await _controller.CancelMyToken(10);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        // Verify the service was called with isAdmin = true
        _mockTokenService.Verify(s => s.CancelTokenAsync(10, 1, true), Times.Once);
    }
}
