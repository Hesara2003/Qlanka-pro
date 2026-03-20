// backend/QueueLanka.API.Tests/CounterServiceBroadcastTests.cs

using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.Events;
using QueueLanka.Queue.Hubs;
using QueueLanka.Queue.Models;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.Events;

namespace QueueLanka.API.Tests;

public class CounterServiceBroadcastTests
{
    private readonly Mock<ICounterRepository> _mockCounterRepository;
    private readonly Mock<ITokenRepository> _mockTokenRepository;
    private readonly Mock<IAuditLogRepository> _mockAuditLogRepository;
    private readonly Mock<IEventBus> _mockEventBus;
    private readonly Mock<IHubContext<QueueHub, IQueueHubClient>> _mockHubContext;
    private readonly Mock<IHubClients<IQueueHubClient>> _mockHubClients;
    private readonly Mock<IQueueHubClient> _mockQueueHubClient;
    private readonly Mock<ILogger<CounterService>> _mockLogger;
    private readonly CounterService _service;

    public CounterServiceBroadcastTests()
    {
        _mockCounterRepository = new Mock<ICounterRepository>();
        _mockTokenRepository = new Mock<ITokenRepository>();
        _mockAuditLogRepository = new Mock<IAuditLogRepository>();
        _mockEventBus = new Mock<IEventBus>();
        _mockHubContext = new Mock<IHubContext<QueueHub, IQueueHubClient>>();
        _mockHubClients = new Mock<IHubClients<IQueueHubClient>>();
        _mockQueueHubClient = new Mock<IQueueHubClient>();
        _mockLogger = new Mock<ILogger<CounterService>>();

        _mockHubContext.SetupGet(h => h.Clients).Returns(_mockHubClients.Object);
        _mockHubClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockQueueHubClient.Object);
        _mockQueueHubClient.Setup(c => c.QueueUpdated(It.IsAny<QueueUpdatedEvent>())).Returns(Task.CompletedTask);
        _mockQueueHubClient.Setup(c => c.CounterStatusChanged(It.IsAny<CounterStatusEvent>())).Returns(Task.CompletedTask);
        _mockQueueHubClient.Setup(c => c.TokenStatusUpdated(It.IsAny<TokenStatusUpdatedEvent>())).Returns(Task.CompletedTask);
        _mockQueueHubClient.Setup(c => c.TokenReassigned(It.IsAny<TokenReassignedEvent>())).Returns(Task.CompletedTask);

        _service = new CounterService(
            _mockCounterRepository.Object,
            _mockTokenRepository.Object,
            _mockAuditLogRepository.Object,
            _mockEventBus.Object,
            _mockHubContext.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task CallNext_BroadcastsQueueUpdated_WithTokenCalledTriggerAndWaitingList()
    {
        var token = new Token
        {
            TokenId = 10,
            CenterId = 2,
            UserId = 100,
            TokenNumber = "A010",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow.AddMinutes(-10),
            Status = "Called",
            CalledAt = DateTime.UtcNow
        };

        _mockCounterRepository.Setup(r => r.IsCounterOpenAsync(5)).ReturnsAsync(true);
        _mockCounterRepository.Setup(r => r.CallNextTokenAsync(5)).ReturnsAsync(token);
        _mockCounterRepository.Setup(r => r.GetWaitingTokensAsync(5)).ReturnsAsync(new List<Token>
        {
            new()
            {
                TokenId = 11,
                TokenNumber = "A011",
                QueuePosition = 1,
                IssuedTime = DateTime.UtcNow.AddMinutes(-5)
            }
        });
        _mockCounterRepository.Setup(r => r.GetServedCountTodayAsync(5)).ReturnsAsync(7);
        _mockCounterRepository.Setup(r => r.GetSkippedCountTodayAsync(5)).ReturnsAsync(2);
        _mockCounterRepository.Setup(r => r.GetAverageServiceTimeAsync(5)).ReturnsAsync(60);

        var result = await _service.CallNextTokenAsync(5);

        result.Should().NotBeNull();
        _mockHubClients.Verify(c => c.Group("counter-5"), Times.Once);
        _mockQueueHubClient.Verify(c => c.QueueUpdated(It.Is<QueueUpdatedEvent>(e =>
            e.CounterId == 5
            && e.CenterId == 2
            && e.TriggerAction == "TokenCalled"
            && e.WaitingCount == 1
            && e.WaitingTokens.Count == 1)), Times.Once);
    }

    [Fact]
    public async Task ServeToken_BroadcastsQueueUpdated_WithUpdatedServedCount()
    {
        var token = new Token
        {
            TokenId = 20,
            CenterId = 2,
            UserId = 101,
            TokenNumber = "A020",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow.AddMinutes(-20),
            CalledAt = DateTime.UtcNow.AddMinutes(-5),
            ServedTime = DateTime.UtcNow,
            Status = "Completed"
        };

        _mockCounterRepository
            .Setup(r => r.UpdateTokenStatusAsync(5, 20, "served"))
            .ReturnsAsync((token, 5, (int?)null));
        _mockCounterRepository.Setup(r => r.GetWaitingTokensAsync(5)).ReturnsAsync(new List<Token>());
        _mockCounterRepository.Setup(r => r.GetServedCountTodayAsync(5)).ReturnsAsync(8);
        _mockCounterRepository.Setup(r => r.GetSkippedCountTodayAsync(5)).ReturnsAsync(2);
        _mockCounterRepository.Setup(r => r.GetAverageServiceTimeAsync(5)).ReturnsAsync(55);

        var response = await _service.UpdateTokenStatusAsync(5, 20, "served");

        response.Status.Should().Be("served");
        _mockHubClients.Verify(c => c.Group("counter-5"), Times.Once);
        _mockQueueHubClient.Verify(c => c.QueueUpdated(It.Is<QueueUpdatedEvent>(e =>
            e.TriggerAction == "TokenServed"
            && e.ServedCountToday == 8
            && e.CounterId == 5)), Times.Once);
    }

    [Fact]
    public async Task SkipToken_BroadcastsQueueUpdated_WithUpdatedSkippedCount()
    {
        var token = new Token
        {
            TokenId = 21,
            CenterId = 2,
            UserId = 101,
            TokenNumber = "A021",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow.AddMinutes(-20),
            CalledAt = DateTime.UtcNow.AddMinutes(-5),
            Status = "Skipped"
        };

        _mockCounterRepository
            .Setup(r => r.UpdateTokenStatusAsync(5, 21, "skipped"))
            .ReturnsAsync((token, 5, (int?)null));
        _mockCounterRepository.Setup(r => r.GetWaitingTokensAsync(5)).ReturnsAsync(new List<Token>());
        _mockCounterRepository.Setup(r => r.GetServedCountTodayAsync(5)).ReturnsAsync(8);
        _mockCounterRepository.Setup(r => r.GetSkippedCountTodayAsync(5)).ReturnsAsync(3);
        _mockCounterRepository.Setup(r => r.GetAverageServiceTimeAsync(5)).ReturnsAsync(55);

        var response = await _service.UpdateTokenStatusAsync(5, 21, "skipped");

        response.Status.Should().Be("skipped");
        _mockQueueHubClient.Verify(c => c.QueueUpdated(It.Is<QueueUpdatedEvent>(e =>
            e.TriggerAction == "TokenSkipped"
            && e.SkippedCountToday == 3
            && e.CounterId == 5)), Times.Once);
    }

    [Fact]
    public async Task ReassignToken_BroadcastsQueueUpdated_ForSourceAndDestinationCounters()
    {
        var token = new Token
        {
            TokenId = 31,
            CenterId = 2,
            UserId = 101,
            TokenNumber = "A031",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow.AddMinutes(-12),
            Status = "Waiting",
            QueuePosition = 2
        };

        _mockTokenRepository.Setup(r => r.GetByIdAsync(31)).ReturnsAsync(token);
        _mockCounterRepository.Setup(r => r.IsCounterOpenAsync(7)).ReturnsAsync(true);
        _mockCounterRepository.Setup(r => r.ReassignTokenAsync(31, 5, 7))
            .ReturnsAsync((token, 5, 7, DateTime.UtcNow));

        _mockCounterRepository.Setup(r => r.GetWaitingTokensAsync(5)).ReturnsAsync(new List<Token>());
        _mockCounterRepository.Setup(r => r.GetServedCountTodayAsync(5)).ReturnsAsync(6);
        _mockCounterRepository.Setup(r => r.GetSkippedCountTodayAsync(5)).ReturnsAsync(1);
        _mockCounterRepository.Setup(r => r.GetAverageServiceTimeAsync(5)).ReturnsAsync(40);

        _mockCounterRepository.Setup(r => r.GetWaitingTokensAsync(7)).ReturnsAsync(new List<Token>
        {
            new()
            {
                TokenId = 31,
                TokenNumber = "A031",
                QueuePosition = 1,
                IssuedTime = DateTime.UtcNow.AddMinutes(-12)
            }
        });
        _mockCounterRepository.Setup(r => r.GetServedCountTodayAsync(7)).ReturnsAsync(4);
        _mockCounterRepository.Setup(r => r.GetSkippedCountTodayAsync(7)).ReturnsAsync(0);
        _mockCounterRepository.Setup(r => r.GetAverageServiceTimeAsync(7)).ReturnsAsync(35);

        var response = await _service.ReassignTokenAsync(5, 31, 7, "balance", 99);

        response.TokenId.Should().Be(31);
        _mockHubClients.Verify(c => c.Group("counter-5"), Times.Once);
        _mockHubClients.Verify(c => c.Group("counter-7"), Times.Once);
        _mockQueueHubClient.Verify(c => c.QueueUpdated(It.Is<QueueUpdatedEvent>(e =>
            e.TriggerAction == "TokenReassigned" && e.CounterId == 5)), Times.Once);
        _mockQueueHubClient.Verify(c => c.QueueUpdated(It.Is<QueueUpdatedEvent>(e =>
            e.TriggerAction == "TokenReassigned" && e.CounterId == 7)), Times.Once);
    }

    [Fact]
    public async Task QueueBroadcastFailure_DoesNotBreakSuccessfulDbOperation()
    {
        var token = new Token
        {
            TokenId = 40,
            CenterId = 2,
            TokenNumber = "A040",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow.AddMinutes(-8),
            Status = "Called",
            CalledAt = DateTime.UtcNow
        };

        _mockCounterRepository.Setup(r => r.IsCounterOpenAsync(5)).ReturnsAsync(true);
        _mockCounterRepository.Setup(r => r.CallNextTokenAsync(5)).ReturnsAsync(token);
        _mockCounterRepository.Setup(r => r.GetWaitingTokensAsync(5)).ReturnsAsync(new List<Token>());
        _mockCounterRepository.Setup(r => r.GetServedCountTodayAsync(5)).ReturnsAsync(1);
        _mockCounterRepository.Setup(r => r.GetSkippedCountTodayAsync(5)).ReturnsAsync(0);
        _mockCounterRepository.Setup(r => r.GetAverageServiceTimeAsync(5)).ReturnsAsync(20);

        _mockQueueHubClient
            .Setup(c => c.QueueUpdated(It.IsAny<QueueUpdatedEvent>()))
            .ThrowsAsync(new Exception("SignalR unavailable"));

        var act = async () => await _service.CallNextTokenAsync(5);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task CounterStatusChange_BroadcastsToCenterGroup()
    {
        await _service.BroadcastCounterStatusChangedAsync(5, 2, true, "Counter 5");

        _mockHubClients.Verify(c => c.Group("queue-2"), Times.Once);
        _mockQueueHubClient.Verify(c => c.CounterStatusChanged(It.Is<CounterStatusEvent>(e =>
            e.CounterId == 5
            && e.CenterId == 2
            && e.IsOpen
            && e.CounterName == "Counter 5")), Times.Once);
    }
}
