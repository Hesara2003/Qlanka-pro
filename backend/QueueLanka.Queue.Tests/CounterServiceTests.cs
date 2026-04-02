using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Counter;
using QueueLanka.Queue.Integration;
using QueueLanka.Queue.Models;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.Events;
using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.Tests;

public class CounterServiceTests
{
    private readonly Mock<ICounterRepository> _counterRepo = new();
    private readonly Mock<ITokenRepository> _tokenRepo = new();
    private readonly Mock<IAuditLogRepository> _auditRepo = new();
    private readonly Mock<IEventBus> _eventBus = new();
    private readonly Mock<IQueueBroadcastService> _broadcast = new();

    private CounterService CreateService(IServiceCenterClient? centerClient = null)
    {
        return new CounterService(
            _counterRepo.Object,
            _tokenRepo.Object,
            _auditRepo.Object,
            _eventBus.Object,
            _broadcast.Object,
            NullLogger<CounterService>.Instance,
            centerClient);
    }

    [Fact]
    public async Task CreateCounterAsync_InvalidCenterId_ThrowsValidationException()
    {
        var service = CreateService();

        Func<Task> act = async () => await service.CreateCounterAsync(new CreateCounterRequestDto
        {
            Name = "Counter A",
            CenterId = 0
        }, adminUserId: 1);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task CreateCounterAsync_DuplicateName_ThrowsInvalidOperationException()
    {
        var centerClient = new Mock<IServiceCenterClient>();
        centerClient.Setup(x => x.GetCenterAsync(1)).ReturnsAsync(new ServiceCenterDto { CenterId = 1 });

        _counterRepo.Setup(x => x.CounterNameExistsInCenterAsync("Counter A", 1)).ReturnsAsync(true);
        var service = CreateService(centerClient.Object);

        Func<Task> act = async () => await service.CreateCounterAsync(new CreateCounterRequestDto
        {
            Name = "Counter A",
            CenterId = 1
        }, adminUserId: 1);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already exists*");
    }

    [Fact]
    public async Task CreateCounterAsync_AssignedUserNotOfficer_ThrowsValidationException()
    {
        var centerClient = new Mock<IServiceCenterClient>();
        centerClient.Setup(x => x.GetCenterAsync(1)).ReturnsAsync(new ServiceCenterDto { CenterId = 1 });

        _counterRepo.Setup(x => x.CounterNameExistsInCenterAsync("Counter B", 1)).ReturnsAsync(false);
        _counterRepo.Setup(x => x.IsOfficerUserAsync(55)).ReturnsAsync(false);

        var service = CreateService(centerClient.Object);

        Func<Task> act = async () => await service.CreateCounterAsync(new CreateCounterRequestDto
        {
            Name = "Counter B",
            CenterId = 1,
            AssignedOfficerUserId = 55
        }, adminUserId: 7);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Officer role*");
    }

    [Fact]
    public async Task UpdateTokenStatusAsync_InvalidStatus_ThrowsArgumentException()
    {
        var service = CreateService();

        Func<Task> act = async () => await service.UpdateTokenStatusAsync(1, 10, "pending");

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task GetDashboardAsync_WhenOfficerNotAssigned_ThrowsUnauthorizedAccessException()
    {
        _counterRepo
            .Setup(x => x.GetCounterDashboardAsync(5))
            .ReturnsAsync((5, "Counter C", true, 100, (Token?)null));

        var service = CreateService();

        Func<Task> act = async () => await service.GetDashboardAsync(5, officerUserId: 101);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GetWaitingTokensAsync_MapsQueuePositionAndEstimatedWait()
    {
        _counterRepo
            .Setup(x => x.GetCounterDashboardAsync(9))
            .ReturnsAsync((9, "Counter D", true, null, (Token?)null));
        _counterRepo
            .Setup(x => x.GetWaitingTokensAsync(9))
            .ReturnsAsync(new List<Token>
            {
                new()
                {
                    TokenId = 1,
                    TokenNumber = "A001",
                    IssuedTime = new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc),
                    QueuePosition = null
                },
                new()
                {
                    TokenId = 2,
                    TokenNumber = "A002",
                    IssuedTime = new DateTime(2026, 1, 1, 8, 1, 0, DateTimeKind.Utc),
                    QueuePosition = 0
                }
            });
        _counterRepo.Setup(x => x.GetAverageServiceTimeAsync(9)).ReturnsAsync(30);

        var service = CreateService();
        var result = await service.GetWaitingTokensAsync(9, officerUserId: 0);

        result.Should().HaveCount(2);
        result[0].QueuePosition.Should().Be(1);
        result[0].EstimatedWaitSeconds.Should().Be(30);
        result[1].QueuePosition.Should().Be(2);
        result[1].EstimatedWaitSeconds.Should().Be(60);
    }
}
