// backend/QueueLanka.API.Tests/CounterManagementServiceTests.cs

using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Counter;
using QueueLanka.Queue.Integration;
using QueueLanka.Queue.Models;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.Events;
using System.ComponentModel.DataAnnotations;

namespace QueueLanka.API.Tests;

public class CounterManagementServiceTests
{
    private readonly Mock<ICounterRepository> _mockCounterRepository;
    private readonly Mock<ITokenRepository> _mockTokenRepository;
    private readonly Mock<IAuditLogRepository> _mockAuditLogRepository;
    private readonly Mock<IEventBus> _mockEventBus;
    private readonly Mock<IQueueBroadcastService> _mockQueueBroadcastService;
    private readonly Mock<ILogger<CounterService>> _mockLogger;
    private readonly Mock<IServiceCenterClient> _mockServiceCenterClient;
    private readonly CounterService _service;

    public CounterManagementServiceTests()
    {
        _mockCounterRepository = new Mock<ICounterRepository>();
        _mockTokenRepository = new Mock<ITokenRepository>();
        _mockAuditLogRepository = new Mock<IAuditLogRepository>();
        _mockEventBus = new Mock<IEventBus>();
        _mockQueueBroadcastService = new Mock<IQueueBroadcastService>();
        _mockLogger = new Mock<ILogger<CounterService>>();
        _mockServiceCenterClient = new Mock<IServiceCenterClient>();

        _service = new CounterService(
            _mockCounterRepository.Object,
            _mockTokenRepository.Object,
            _mockAuditLogRepository.Object,
            _mockEventBus.Object,
            _mockQueueBroadcastService.Object,
            _mockLogger.Object,
            _mockServiceCenterClient.Object);
    }

    [Fact]
    public async Task CreateCounter_ValidRequest_ReturnsCreatedCounter()
    {
        var request = new CreateCounterRequestDto
        {
            Name = "Counter A",
            CenterId = 10,
            AssignedOfficerUserId = 200
        };

        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync(new ServiceCenterDto { CenterId = 10, Name = "Center 10" });
        _mockCounterRepository.Setup(r => r.CounterNameExistsInCenterAsync("Counter A", 10)).ReturnsAsync(false);
        _mockCounterRepository.Setup(r => r.IsOfficerUserAsync(200)).ReturnsAsync(true);
        _mockCounterRepository.Setup(r => r.CreateCounterAsync("Counter A", 10, 200)).ReturnsAsync(new CounterResponseDto
        {
            CounterId = 1,
            Name = "Counter A",
            CenterId = 10,
            CenterName = "Center 10",
            IsOpen = false,
            AssignedOfficerUserId = 200,
            AssignedOfficerName = "Officer One",
            CreatedAt = DateTime.UtcNow
        });

        var result = await _service.CreateCounterAsync(request, 99);

        result.CounterId.Should().Be(1);
        result.Name.Should().Be("Counter A");
        result.CenterId.Should().Be(10);
    }

    [Fact]
    public async Task CreateCounter_DuplicateName_ThrowsConflictExceptionEquivalent()
    {
        var request = new CreateCounterRequestDto { Name = "Counter A", CenterId = 10 };

        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync(new ServiceCenterDto { CenterId = 10, Name = "Center 10" });
        _mockCounterRepository.Setup(r => r.CounterNameExistsInCenterAsync("Counter A", 10)).ReturnsAsync(true);

        Func<Task> act = async () => await _service.CreateCounterAsync(request, 99);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task CreateCounter_CenterNotFound_ThrowsNotFoundExceptionEquivalent()
    {
        var request = new CreateCounterRequestDto { Name = "Counter A", CenterId = 10 };

        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync((ServiceCenterDto?)null);

        Func<Task> act = async () => await _service.CreateCounterAsync(request, 99);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task CreateCounter_InvalidOfficerUserId_ThrowsValidationException()
    {
        var request = new CreateCounterRequestDto { Name = "Counter A", CenterId = 10, AssignedOfficerUserId = 999 };

        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync(new ServiceCenterDto { CenterId = 10, Name = "Center 10" });
        _mockCounterRepository.Setup(r => r.CounterNameExistsInCenterAsync("Counter A", 10)).ReturnsAsync(false);
        _mockCounterRepository.Setup(r => r.IsOfficerUserAsync(999)).ReturnsAsync(false);

        Func<Task> act = async () => await _service.CreateCounterAsync(request, 99);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task ListCounters_ReturnsCorrectOpenAndClosedCounts()
    {
        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync(new ServiceCenterDto { CenterId = 10, Name = "Center 10" });
        _mockCounterRepository.Setup(r => r.GetCountersByCenterAsync(10)).ReturnsAsync(new List<CounterResponseDto>
        {
            new() { CounterId = 1, Name = "Counter A", CenterId = 10, IsOpen = true },
            new() { CounterId = 2, Name = "Counter B", CenterId = 10, IsOpen = false },
            new() { CounterId = 3, Name = "Counter C", CenterId = 10, IsOpen = true }
        });

        var result = await _service.GetCountersByCenterAsync(10, 99);

        result.TotalCount.Should().Be(3);
        result.OpenCount.Should().Be(2);
        result.ClosedCount.Should().Be(1);
    }

    [Fact]
    public async Task ListCounters_CenterNotFound_ThrowsNotFoundExceptionEquivalent()
    {
        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync((ServiceCenterDto?)null);

        Func<Task> act = async () => await _service.GetCountersByCenterAsync(10, 99);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task UpdateStatusToOpen_ReturnsUpdatedCounter()
    {
        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync(new ServiceCenterDto { CenterId = 10, Name = "Center 10" });
        _mockCounterRepository.Setup(r => r.CounterExistsAsync(1, 10)).ReturnsAsync(true);
        _mockCounterRepository.Setup(r => r.GetCounterQueueStateAsync(1)).ReturnsAsync((0, false));
        _mockCounterRepository.Setup(r => r.UpdateCounterStatusAsync(1, true, null)).ReturnsAsync(new CounterResponseDto
        {
            CounterId = 1,
            Name = "Counter A",
            CenterId = 10,
            IsOpen = true
        });

        var result = await _service.UpdateCounterStatusAsync(10, 1, new UpdateCounterStatusRequestDto { IsOpen = true }, 99);

        result.IsOpen.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateStatusToClosed_ReturnsUpdatedCounter()
    {
        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync(new ServiceCenterDto { CenterId = 10, Name = "Center 10" });
        _mockCounterRepository.Setup(r => r.CounterExistsAsync(1, 10)).ReturnsAsync(true);
        _mockCounterRepository.Setup(r => r.GetCounterQueueStateAsync(1)).ReturnsAsync((0, false));
        _mockCounterRepository.Setup(r => r.UpdateCounterStatusAsync(1, false, "lunch break")).ReturnsAsync(new CounterResponseDto
        {
            CounterId = 1,
            Name = "Counter A",
            CenterId = 10,
            IsOpen = false
        });

        var result = await _service.UpdateCounterStatusAsync(
            10,
            1,
            new UpdateCounterStatusRequestDto { IsOpen = false, Reason = "lunch break" },
            99);

        result.IsOpen.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateStatus_CounterNotFound_ThrowsNotFoundExceptionEquivalent()
    {
        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync(new ServiceCenterDto { CenterId = 10, Name = "Center 10" });
        _mockCounterRepository.Setup(r => r.CounterExistsAsync(1, 10)).ReturnsAsync(false);

        Func<Task> act = async () => await _service.UpdateCounterStatusAsync(10, 1, new UpdateCounterStatusRequestDto { IsOpen = true }, 99);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task UpdateStatusToClosedWithWaitingTokens_SucceedsWithWarningMessage()
    {
        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync(new ServiceCenterDto { CenterId = 10, Name = "Center 10" });
        _mockCounterRepository.Setup(r => r.CounterExistsAsync(1, 10)).ReturnsAsync(true);
        _mockCounterRepository.Setup(r => r.GetCounterQueueStateAsync(1)).ReturnsAsync((3, false));
        _mockCounterRepository.Setup(r => r.UpdateCounterStatusAsync(1, false, "maintenance")).ReturnsAsync(new CounterResponseDto
        {
            CounterId = 1,
            Name = "Counter A",
            CenterId = 10,
            IsOpen = false
        });

        var result = await _service.UpdateCounterStatusAsync(
            10,
            1,
            new UpdateCounterStatusRequestDto { IsOpen = false, Reason = "maintenance" },
            99);

        result.WarningMessage.Should().Contain("waiting token");
    }

    [Fact]
    public async Task BroadcastCalledAfterStatusUpdate_CounterStatusChangedEventFired()
    {
        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync(new ServiceCenterDto { CenterId = 10, Name = "Center 10" });
        _mockCounterRepository.Setup(r => r.CounterExistsAsync(1, 10)).ReturnsAsync(true);
        _mockCounterRepository.Setup(r => r.GetCounterQueueStateAsync(1)).ReturnsAsync((0, false));
        _mockCounterRepository.Setup(r => r.UpdateCounterStatusAsync(1, true, null)).ReturnsAsync(new CounterResponseDto
        {
            CounterId = 1,
            Name = "Counter A",
            CenterId = 10,
            IsOpen = true
        });

        await _service.UpdateCounterStatusAsync(10, 1, new UpdateCounterStatusRequestDto { IsOpen = true }, 99);

        _mockQueueBroadcastService.Verify(b => b.BroadcastCounterStatusChanged(It.IsAny<QueueLanka.Queue.Events.CounterStatusEvent>()), Times.Once);
    }

    [Fact]
    public async Task BroadcastFailure_StatusUpdateStillSucceeds()
    {
        _mockServiceCenterClient.Setup(c => c.GetCenterAsync(10)).ReturnsAsync(new ServiceCenterDto { CenterId = 10, Name = "Center 10" });
        _mockCounterRepository.Setup(r => r.CounterExistsAsync(1, 10)).ReturnsAsync(true);
        _mockCounterRepository.Setup(r => r.GetCounterQueueStateAsync(1)).ReturnsAsync((0, false));
        _mockCounterRepository.Setup(r => r.UpdateCounterStatusAsync(1, true, null)).ReturnsAsync(new CounterResponseDto
        {
            CounterId = 1,
            Name = "Counter A",
            CenterId = 10,
            IsOpen = true
        });
        _mockQueueBroadcastService
            .Setup(b => b.BroadcastCounterStatusChanged(It.IsAny<QueueLanka.Queue.Events.CounterStatusEvent>()))
            .ThrowsAsync(new Exception("SignalR unavailable"));

        var act = async () => await _service.UpdateCounterStatusAsync(10, 1, new UpdateCounterStatusRequestDto { IsOpen = true }, 99);

        await act.Should().NotThrowAsync();
    }
}
