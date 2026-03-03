using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using QueueLanka.API.Controllers;
using QueueLanka.API.DTOs.Appointment;
using QueueLanka.API.DTOs.Common;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Services;
using System.Security.Claims;

namespace QueueLanka.API.Tests;

public class AppointmentControllerTests
{
    private readonly Mock<IAppointmentService> _mockAppointmentService;
    private readonly Mock<ILogger<AppointmentController>> _mockLogger;
    private readonly AppointmentController _controller;

    public AppointmentControllerTests()
    {
        _mockAppointmentService = new Mock<IAppointmentService>();
        _mockLogger = new Mock<ILogger<AppointmentController>>();
        _controller = new AppointmentController(_mockAppointmentService.Object, _mockLogger.Object);

        // Default: authenticated user
        SetAuthenticatedUser(1);
    }

    // ────────────────────── Helper Methods ──────────────────────

    private void SetAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, "citizen")
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

    // ────────────────────── BookToken Tests ──────────────────────

    [Fact]
    public async Task BookToken_ValidRequest_ReturnsOk()
    {
        // Arrange
        var requestDto = new BookAppointmentRequestDto
        {
            CenterId = 1,
            AppointmentDate = DateTime.Today.AddDays(1),
            AppointmentTime = new TimeSpan(10, 0, 0)
        };
        var responseDto = new AppointmentResponseDto
        {
            AppointmentId = 100,
            CenterId = 1,
            UserId = 1,
            TokenNumber = "T001",
            Status = "Waiting"
        };
        _mockAppointmentService
            .Setup(s => s.BookTokenAsync(1, requestDto))
            .ReturnsAsync(responseDto);

        // Act
        var result = await _controller.BookToken(requestDto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var response = okResult.Value.Should().BeOfType<ApiResponse<AppointmentResponseDto>>().Subject;
        response.Data!.TokenNumber.Should().Be("T001");
    }

    [Fact]
    public async Task BookToken_UnauthenticatedUser_ReturnsUnauthorized()
    {
        // Arrange
        SetUnauthenticatedUser();
        var requestDto = new BookAppointmentRequestDto { CenterId = 1 };

        // Act
        var result = await _controller.BookToken(requestDto);

        // Assert
        var unauthorizedResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorizedResult.StatusCode.Should().Be(401);
    }

    [Fact]
    public async Task BookToken_ArgumentException_ReturnsNotFound()
    {
        // Arrange
        var requestDto = new BookAppointmentRequestDto { CenterId = 999 };
        _mockAppointmentService
            .Setup(s => s.BookTokenAsync(1, requestDto))
            .ThrowsAsync(new ArgumentException("Center not found"));

        // Act
        var result = await _controller.BookToken(requestDto);

        // Assert
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task BookToken_InvalidOperationException_ReturnsConflict()
    {
        // Arrange
        var requestDto = new BookAppointmentRequestDto { CenterId = 1 };
        _mockAppointmentService
            .Setup(s => s.BookTokenAsync(1, requestDto))
            .ThrowsAsync(new InvalidOperationException("Booking conflict"));

        // Act
        var result = await _controller.BookToken(requestDto);

        // Assert
        var conflictResult = result.Should().BeOfType<ConflictObjectResult>().Subject;
        conflictResult.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task BookToken_DuplicateBookingException_Throws()
    {
        // Arrange
        var requestDto = new BookAppointmentRequestDto { CenterId = 1 };
        _mockAppointmentService
            .Setup(s => s.BookTokenAsync(1, requestDto))
            .ThrowsAsync(new DuplicateBookingException());

        // Act
        Func<Task> act = async () => await _controller.BookToken(requestDto);

        // Assert — AppException subclasses are re-thrown for global middleware
        await act.Should().ThrowAsync<DuplicateBookingException>();
    }

    [Fact]
    public async Task BookToken_CenterFullException_Throws()
    {
        // Arrange
        var requestDto = new BookAppointmentRequestDto { CenterId = 1 };
        _mockAppointmentService
            .Setup(s => s.BookTokenAsync(1, requestDto))
            .ThrowsAsync(new CenterFullException());

        // Act
        Func<Task> act = async () => await _controller.BookToken(requestDto);

        // Assert — AppException subclasses are re-thrown for global middleware
        await act.Should().ThrowAsync<CenterFullException>();
    }

    [Fact]
    public async Task BookToken_UnexpectedException_ReturnsStatusCode500()
    {
        // Arrange
        var requestDto = new BookAppointmentRequestDto { CenterId = 1 };
        _mockAppointmentService
            .Setup(s => s.BookTokenAsync(1, requestDto))
            .ThrowsAsync(new Exception("Something broke"));

        // Act
        var result = await _controller.BookToken(requestDto);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    // ────────────────────── GetMyAppointments Tests ──────────────────────

    [Fact]
    public async Task GetMyAppointments_AuthenticatedUser_ReturnsOkWithList()
    {
        // Arrange
        var appointments = new List<AppointmentResponseDto>
        {
            new AppointmentResponseDto { AppointmentId = 1, CenterId = 1, Status = "Waiting" },
            new AppointmentResponseDto { AppointmentId = 2, CenterId = 2, Status = "Completed" }
        };
        _mockAppointmentService
            .Setup(s => s.GetUserAppointmentsAsync(1))
            .ReturnsAsync(appointments);

        // Act
        var result = await _controller.GetMyAppointments();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<AppointmentResponseDto>>>().Subject;
        response.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetMyAppointments_UnauthenticatedUser_ReturnsUnauthorized()
    {
        // Arrange
        SetUnauthenticatedUser();

        // Act
        var result = await _controller.GetMyAppointments();

        // Assert
        var unauthorizedResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorizedResult.StatusCode.Should().Be(401);
    }

    [Fact]
    public async Task GetMyAppointments_NoAppointments_ReturnsOkWithEmptyList()
    {
        // Arrange
        _mockAppointmentService
            .Setup(s => s.GetUserAppointmentsAsync(1))
            .ReturnsAsync(new List<AppointmentResponseDto>());

        // Act
        var result = await _controller.GetMyAppointments();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<AppointmentResponseDto>>>().Subject;
        response.Data.Should().BeEmpty();
    }
}
