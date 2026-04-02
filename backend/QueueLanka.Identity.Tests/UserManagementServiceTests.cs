using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using QueueLanka.Identity.Data;
using QueueLanka.Identity.Models;
using QueueLanka.Identity.Services;
using QueueLanka.Shared.Exceptions;

namespace QueueLanka.Identity.Tests;

public class UserManagementServiceTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<ILogger<UserManagementService>> _logger = new();

    private UserManagementService CreateService() => new(_users.Object, _logger.Object);

    [Fact]
    public async Task GetUsersAsync_MapsRepositoryUsersToDtos()
    {
        _users.Setup(x => x.GetAllAsync("citizen", true))
            .ReturnsAsync(new List<User>
            {
                new() { UserId = 10, Username = "alice", Email = "alice@example.com", Role = "citizen", IsActive = true }
            });

        var service = CreateService();
        var result = (await service.GetUsersAsync("citizen", true)).ToList();

        result.Should().HaveCount(1);
        result[0].UserId.Should().Be(10);
        result[0].Username.Should().Be("alice");
        result[0].Role.Should().Be("citizen");
    }

    [Fact]
    public async Task GetUsersAsync_WhenRepositoryFails_ThrowsDataAccessException()
    {
        _users.Setup(x => x.GetAllAsync(It.IsAny<string?>(), It.IsAny<bool?>()))
            .ThrowsAsync(new Exception("db down"));

        var service = CreateService();
        Func<Task> act = async () => await service.GetUsersAsync();

        await act.Should().ThrowAsync<DataAccessException>()
            .WithMessage("*Failed to retrieve users*");
    }

    [Fact]
    public async Task DeleteUserAsync_WhenUserMissing_ThrowsUserNotFoundException()
    {
        _users.Setup(x => x.GetByIdAsync(99)).ReturnsAsync((User?)null);
        var service = CreateService();

        Func<Task> act = async () => await service.DeleteUserAsync(99, 1);

        await act.Should().ThrowAsync<UserNotFoundException>();
    }

    [Fact]
    public async Task DeleteUserAsync_WhenUserAlreadyDeleted_ThrowsUserNotFoundException()
    {
        _users.Setup(x => x.GetByIdAsync(11)).ReturnsAsync(new User
        {
            UserId = 11,
            Role = "citizen",
            DeletedAt = DateTime.UtcNow
        });
        var service = CreateService();

        Func<Task> act = async () => await service.DeleteUserAsync(11, 1);

        await act.Should().ThrowAsync<UserNotFoundException>();
    }

    [Fact]
    public async Task DeleteUserAsync_WhenTargetIsAdmin_ThrowsCannotDeleteAdminException()
    {
        _users.Setup(x => x.GetByIdAsync(5)).ReturnsAsync(new User
        {
            UserId = 5,
            Role = "admin"
        });
        var service = CreateService();

        Func<Task> act = async () => await service.DeleteUserAsync(5, 1);

        await act.Should().ThrowAsync<CannotDeleteAdminException>();
    }

    [Fact]
    public async Task DeleteUserAsync_ValidTarget_SoftDeletesAndWritesAuditLog()
    {
        _users.Setup(x => x.GetByIdAsync(7)).ReturnsAsync(new User
        {
            UserId = 7,
            Role = "citizen"
        });

        var service = CreateService();
        await service.DeleteUserAsync(7, 42);

        _users.Verify(x => x.SoftDeleteAsync(7, 42), Times.Once);
        _users.Verify(x => x.AddAuditLogAsync(It.Is<UserAuditLog>(a =>
            a.UserId == 7 &&
            a.PerformedBy == 42 &&
            a.Action == AuditAction.Deleted)), Times.Once);
    }

    [Fact]
    public async Task DeleteUserAsync_WhenDeleteFails_ThrowsDataAccessException()
    {
        _users.Setup(x => x.GetByIdAsync(7)).ReturnsAsync(new User
        {
            UserId = 7,
            Role = "citizen"
        });
        _users.Setup(x => x.SoftDeleteAsync(7, 42)).ThrowsAsync(new Exception("write failed"));

        var service = CreateService();
        Func<Task> act = async () => await service.DeleteUserAsync(7, 42);

        await act.Should().ThrowAsync<DataAccessException>()
            .WithMessage("*Failed to delete user*");
    }
}
