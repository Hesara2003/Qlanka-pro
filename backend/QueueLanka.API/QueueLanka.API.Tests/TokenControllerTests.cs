using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using QueueLanka.API.Controllers;
using QueueLanka.API.DTOs.Token;
using QueueLanka.API.Services;
using System.Security.Claims;
using Xunit;

namespace QueueLanka.API.Tests;

public class TokenControllerTests
{
    private readonly Mock<ITokenService> _mockTokenService;
    private readonly TokenController _controller;

    public TokenControllerTests()
    {
        _mockTokenService = new Mock<ITokenService>();
        _controller = new TokenController(_mockTokenService.Object);
    }

    // -------------------------------------------------------------------------
    // Helper: attach a fake authenticated user (with a NameIdentifier claim)
    //         to the controller's HttpContext.
    // -------------------------------------------------------------------------
    private void SetAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
        var identity = new ClaimsIdentity(claims, authenticationType: "TestAuth");
        var user = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    // Helper: attach an HttpContext with NO user claims (simulates missing/invalid token).
    private void SetUnauthenticatedUser()
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()   // User is an empty ClaimsPrincipal
        };
    }

    // =========================================================================
    // GetMyTokens()
    // =========================================================================

    [Fact]
    public async Task GetMyTokens_ValidUser_ReturnsOkWithTokenList()
    {
        // Arrange
        SetAuthenticatedUser(userId: 1);

        var fakeTokens = new List<UserTokenResponseDto>
        {
            new UserTokenResponseDto { TokenId = 1, TokenNumber = "T001", Status = "Waiting" },
            new UserTokenResponseDto { TokenId = 2, TokenNumber = "T002", Status = "Completed" }
        };

        _mockTokenService
            .Setup(s => s.GetUserTokensAsync(1))
            .ReturnsAsync(fakeTokens);

        // Act
        var actionResult = await _controller.GetMyTokens();

        // Assert
        // ActionResult<T>.Result holds the IActionResult (e.g. OkObjectResult)
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
        okResult.Value.Should().BeEquivalentTo(fakeTokens);
    }

    [Fact]
    public async Task GetMyTokens_MissingUserClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetUnauthenticatedUser();

        // Act
        var actionResult = await _controller.GetMyTokens();

        // Assert
        var unauthorizedResult = actionResult.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    // =========================================================================
    // CancelMyToken(int tokenId)
    // =========================================================================

    [Fact]
    public async Task CancelMyToken_ValidUserAndTokenCancelled_ReturnsOk()
    {
        // Arrange
        SetAuthenticatedUser(userId: 1);

        _mockTokenService
            .Setup(s => s.CancelTokenAsync(5, 1))
            .ReturnsAsync(true);   // service reports success

        // Act
        var result = await _controller.CancelMyToken(tokenId: 5);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task CancelMyToken_TokenCannotBeCancelled_ReturnsBadRequest()
    {
        // Arrange – service returns false (token not found, wrong owner, or not Waiting)
        SetAuthenticatedUser(userId: 1);

        _mockTokenService
            .Setup(s => s.CancelTokenAsync(99, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CancelMyToken(tokenId: 99);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task CancelMyToken_MissingUserClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetUnauthenticatedUser();

        // Act
        var result = await _controller.CancelMyToken(tokenId: 5);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }
}
