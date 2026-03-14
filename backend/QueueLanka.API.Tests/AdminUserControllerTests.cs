using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using QueueLanka.API.Controllers;
using QueueLanka.API.DTOs.Common;
using QueueLanka.API.DTOs.User;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Services;
using System.Security.Claims;

namespace QueueLanka.API.Tests;

public class AdminUserControllerTests
{
    private readonly Mock<IUserManagementService> _mockUserManagement;
    private readonly Mock<ILogger<AdminUserController>> _mockLogger;
    private readonly AdminUserController _controller;

    public AdminUserControllerTests()
    {
        _mockUserManagement = new Mock<IUserManagementService>();
        _mockLogger = new Mock<ILogger<AdminUserController>>();
        _controller = new AdminUserController(_mockUserManagement.Object, _mockLogger.Object);

        // Set up a default authenticated admin user
        SetAuthenticatedUser(1);
    }

    // ────────────────────── Helper Methods ──────────────────────

    private void SetAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, "admin")
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

    // ────────────────────── GetUsers Tests ──────────────────────

    [Fact]
    public async Task GetUsers_NoFilters_ReturnsOkWithUserList()
    {
        // Arrange
        var users = new List<AdminUserDto>
        {
            new AdminUserDto { UserId = 1, Username = "john", Role = "citizen" },
            new AdminUserDto { UserId = 2, Username = "jane", Role = "officer" }
        };
        _mockUserManagement
            .Setup(s => s.GetUsersAsync(null, null))
            .ReturnsAsync(users);

        // Act
        var result = await _controller.GetUsers();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<AdminUserDto>>>().Subject;
        response.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetUsers_WithRoleFilter_ReturnsOkWithFilteredList()
    {
        // Arrange
        var users = new List<AdminUserDto>
        {
            new AdminUserDto { UserId = 1, Username = "john", Role = "citizen" }
        };
        _mockUserManagement
            .Setup(s => s.GetUsersAsync("citizen", null))
            .ReturnsAsync(users);

        // Act
        var result = await _controller.GetUsers(role: "citizen");

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<AdminUserDto>>>().Subject;
        response.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetUsers_WithIsActiveFilter_ReturnsOkWithFilteredList()
    {
        // Arrange
        var users = new List<AdminUserDto>
        {
            new AdminUserDto { UserId = 1, Username = "active_user", IsActive = true }
        };
        _mockUserManagement
            .Setup(s => s.GetUsersAsync(null, true))
            .ReturnsAsync(users);

        // Act
        var result = await _controller.GetUsers(isActive: true);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<AdminUserDto>>>().Subject;
        response.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetUsers_InvalidRoleFilter_ThrowsInvalidUserRoleFilterException()
    {
        // Arrange
        var invalidRole = "superuser";

        // Act
        Func<Task> act = async () => await _controller.GetUsers(role: invalidRole);

        // Assert
        await act.Should().ThrowAsync<InvalidUserRoleFilterException>();
    }

    [Fact]
    public async Task GetUsers_EmptyResult_ReturnsOkWithEmptyList()
    {
        // Arrange
        _mockUserManagement
            .Setup(s => s.GetUsersAsync(null, null))
            .ReturnsAsync(new List<AdminUserDto>());

        // Act
        var result = await _controller.GetUsers();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<AdminUserDto>>>().Subject;
        response.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task GetUsers_ServiceThrowsException_Throws()
    {
        // Arrange
        _mockUserManagement
            .Setup(s => s.GetUsersAsync(null, null))
            .ThrowsAsync(new DataAccessException("DB error"));

        // Act
        Func<Task> act = async () => await _controller.GetUsers();

        // Assert
        await act.Should().ThrowAsync<DataAccessException>();
    }

    // ────────────────────── DeleteUser Tests ──────────────────────

    [Fact]
    public async Task DeleteUser_ValidId_ReturnsOk()
    {
        // Arrange
        int userId = 5;
        _mockUserManagement
            .Setup(s => s.DeleteUserAsync(userId, 1))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeleteUser(userId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task DeleteUser_ZeroId_ThrowsInvalidUserIdException()
    {
        // Arrange
        int userId = 0;

        // Act
        Func<Task> act = async () => await _controller.DeleteUser(userId);

        // Assert
        await act.Should().ThrowAsync<InvalidUserIdException>();
    }

    [Fact]
    public async Task DeleteUser_NegativeId_ThrowsInvalidUserIdException()
    {
        // Arrange
        int userId = -1;

        // Act
        Func<Task> act = async () => await _controller.DeleteUser(userId);

        // Assert
        await act.Should().ThrowAsync<InvalidUserIdException>();
    }

    [Fact]
    public async Task DeleteUser_UserNotFound_ThrowsUserNotFoundException()
    {
        // Arrange
        int userId = 999;
        _mockUserManagement
            .Setup(s => s.DeleteUserAsync(userId, 1))
            .ThrowsAsync(new UserNotFoundException(userId));

        // Act
        Func<Task> act = async () => await _controller.DeleteUser(userId);

        // Assert
        await act.Should().ThrowAsync<UserNotFoundException>();
    }

    [Fact]
    public async Task DeleteUser_TargetIsAdmin_ThrowsCannotDeleteAdminException()
    {
        // Arrange
        int userId = 2;
        _mockUserManagement
            .Setup(s => s.DeleteUserAsync(userId, 1))
            .ThrowsAsync(new CannotDeleteAdminException());

        // Act
        Func<Task> act = async () => await _controller.DeleteUser(userId);

        // Assert
        await act.Should().ThrowAsync<CannotDeleteAdminException>();
    }

    [Fact]
    public async Task DeleteUser_ServiceThrowsDataAccessException_Throws()
    {
        // Arrange
        int userId = 5;
        _mockUserManagement
            .Setup(s => s.DeleteUserAsync(userId, 1))
            .ThrowsAsync(new DataAccessException("DB error"));

        // Act
        Func<Task> act = async () => await _controller.DeleteUser(userId);

        // Assert
        await act.Should().ThrowAsync<DataAccessException>();
    }
}
