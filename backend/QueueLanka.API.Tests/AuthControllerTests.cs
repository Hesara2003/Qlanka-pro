using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using QueueLanka.API.Controllers;
using QueueLanka.API.DTOs.Auth;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Services;

namespace QueueLanka.API.Tests;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _mockAuthService;
    private readonly Mock<IEmailVerificationService> _mockEmailVerification;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockAuthService = new Mock<IAuthService>();
        _mockEmailVerification = new Mock<IEmailVerificationService>();
        _controller = new AuthController(_mockAuthService.Object, _mockEmailVerification.Object);

        // Give the controller an HttpContext so TraceIdentifier works
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    // ────────────────────── Register Tests ──────────────────────

    [Fact]
    public async Task Register_ValidRequest_Returns201Created()
    {
        // Arrange
        var requestDto = new RegisterRequestDto
        {
            Username = "testuser",
            Password = "P@ssw0rd!",
            Email = "test@example.com",
            Role = "citizen"
        };
        var responseDto = new RegisterResponseDto
        {
            UserId = 1,
            Username = "testuser",
            Role = "citizen"
        };
        _mockAuthService
            .Setup(s => s.RegisterAsync(requestDto))
            .ReturnsAsync(responseDto);

        // Act
        var result = await _controller.Register(requestDto);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(201);

        var response = objectResult.Value.Should().BeOfType<RegisterResponseDto>().Subject;
        response.UserId.Should().Be(1);
        response.Username.Should().Be("testuser");
    }

    [Fact]
    public async Task Register_DuplicateUsername_ThrowsDuplicateUsernameException()
    {
        // Arrange
        var requestDto = new RegisterRequestDto
        {
            Username = "existing",
            Password = "P@ssw0rd!",
            Email = "new@example.com",
            Role = "citizen"
        };
        _mockAuthService
            .Setup(s => s.RegisterAsync(requestDto))
            .ThrowsAsync(new DuplicateUsernameException("existing"));

        // Act
        Func<Task> act = async () => await _controller.Register(requestDto);

        // Assert
        await act.Should().ThrowAsync<DuplicateUsernameException>();
    }

    [Fact]
    public async Task Register_DuplicateEmail_ThrowsDuplicateEmailException()
    {
        // Arrange
        var requestDto = new RegisterRequestDto
        {
            Username = "newuser",
            Password = "P@ssw0rd!",
            Email = "existing@example.com",
            Role = "citizen"
        };
        _mockAuthService
            .Setup(s => s.RegisterAsync(requestDto))
            .ThrowsAsync(new DuplicateEmailException("existing@example.com"));

        // Act
        Func<Task> act = async () => await _controller.Register(requestDto);

        // Assert
        await act.Should().ThrowAsync<DuplicateEmailException>();
    }

    [Fact]
    public async Task Register_InvalidModelState_ReturnsUnprocessableEntity()
    {
        // Arrange
        _controller.ModelState.AddModelError("Username", "Username is required");
        var requestDto = new RegisterRequestDto();

        // Act
        var result = await _controller.Register(requestDto);

        // Assert
        var unprocessableResult = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
        unprocessableResult.StatusCode.Should().Be(422);
    }

    // ────────────────────── Login Tests ──────────────────────

    [Fact]
    public async Task Login_ValidCredentials_ReturnsOk()
    {
        // Arrange
        var requestDto = new LoginRequestDto
        {
            Username = "testuser",
            Password = "P@ssw0rd!"
        };
        var responseDto = new LoginResponseDto
        {
            Token = "jwt-token-here",
            Role = "citizen",
            ExpiresIn = 3600
        };
        _mockAuthService
            .Setup(s => s.LoginAsync(requestDto))
            .ReturnsAsync(responseDto);

        // Act
        var result = await _controller.Login(requestDto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var response = okResult.Value.Should().BeOfType<LoginResponseDto>().Subject;
        response.Token.Should().Be("jwt-token-here");
    }

    [Fact]
    public async Task Login_InvalidCredentials_ThrowsInvalidCredentialsException()
    {
        // Arrange
        var requestDto = new LoginRequestDto
        {
            Username = "testuser",
            Password = "WrongPassword"
        };
        _mockAuthService
            .Setup(s => s.LoginAsync(requestDto))
            .ThrowsAsync(new InvalidCredentialsException());

        // Act
        Func<Task> act = async () => await _controller.Login(requestDto);

        // Assert
        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }

    [Fact]
    public async Task Login_AccountDisabled_ThrowsAccountDisabledException()
    {
        // Arrange
        var requestDto = new LoginRequestDto
        {
            Username = "disabled_user",
            Password = "P@ssw0rd!"
        };
        _mockAuthService
            .Setup(s => s.LoginAsync(requestDto))
            .ThrowsAsync(new AccountDisabledException());

        // Act
        Func<Task> act = async () => await _controller.Login(requestDto);

        // Assert
        await act.Should().ThrowAsync<AccountDisabledException>();
    }

    [Fact]
    public async Task Login_InvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("Username", "Username is required");
        var requestDto = new LoginRequestDto();

        // Act
        var result = await _controller.Login(requestDto);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.StatusCode.Should().Be(400);
    }

    // ────────────────────── VerifyEmail Tests ──────────────────────

    [Fact]
    public async Task VerifyEmail_ValidToken_ReturnsOk()
    {
        // Arrange
        var token = "valid-verification-token";
        _mockEmailVerification
            .Setup(s => s.VerifyAsync(token))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.VerifyEmail(token);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var response = okResult.Value.Should().BeOfType<VerifyEmailResponseDto>().Subject;
        response.Message.Should().Contain("verified");
    }

    [Fact]
    public async Task VerifyEmail_EmptyToken_ReturnsBadRequest()
    {
        // Arrange
        var token = "";

        // Act
        var result = await _controller.VerifyEmail(token);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task VerifyEmail_WhitespaceToken_ReturnsBadRequest()
    {
        // Arrange
        var token = "   ";

        // Act
        var result = await _controller.VerifyEmail(token);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task VerifyEmail_InvalidToken_ThrowsInvalidVerificationTokenException()
    {
        // Arrange
        var token = "expired-token";
        _mockEmailVerification
            .Setup(s => s.VerifyAsync(token))
            .ThrowsAsync(new InvalidVerificationTokenException());

        // Act
        Func<Task> act = async () => await _controller.VerifyEmail(token);

        // Assert
        await act.Should().ThrowAsync<InvalidVerificationTokenException>();
    }
}
