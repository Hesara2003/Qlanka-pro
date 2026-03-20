// backend/QueueLanka.API.Tests/QueueBroadcastServiceTests.cs

using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using QueueLanka.Queue.Events;
using QueueLanka.Queue.Hubs;
using QueueLanka.Queue.Services;

namespace QueueLanka.API.Tests;

public class QueueBroadcastServiceTests
{
    private readonly Mock<IHubContext<QueueHub, IQueueHubClient>> _mockHubContext;
    private readonly Mock<IHubClients<IQueueHubClient>> _mockHubClients;
    private readonly Mock<IQueueHubClient> _mockQueueHubClient;
    private readonly Mock<ILogger<QueueBroadcastService>> _mockLogger;
    private readonly QueueBroadcastService _service;

    public QueueBroadcastServiceTests()
    {
        _mockHubContext = new Mock<IHubContext<QueueHub, IQueueHubClient>>();
        _mockHubClients = new Mock<IHubClients<IQueueHubClient>>();
        _mockQueueHubClient = new Mock<IQueueHubClient>();
        _mockLogger = new Mock<ILogger<QueueBroadcastService>>();

        _mockHubContext.SetupGet(h => h.Clients).Returns(_mockHubClients.Object);
        _mockHubClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockQueueHubClient.Object);

        _mockQueueHubClient.Setup(c => c.TokenCalled(It.IsAny<TokenCalledEvent>())).Returns(Task.CompletedTask);
        _mockQueueHubClient.Setup(c => c.TokenStatusUpdated(It.IsAny<TokenStatusUpdatedEvent>())).Returns(Task.CompletedTask);
        _mockQueueHubClient.Setup(c => c.TokenCancelled(It.IsAny<TokenCancelledEvent>())).Returns(Task.CompletedTask);
        _mockQueueHubClient.Setup(c => c.QueueUpdated(It.IsAny<QueueUpdatedEvent>())).Returns(Task.CompletedTask);

        _service = new QueueBroadcastService(_mockHubContext.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task BroadcastTokenCalled_SendsToCorrectQueueCenterGroup()
    {
        var payload = new TokenCalledEvent
        {
            TokenId = 10,
            TokenNumber = "A010",
            CenterId = 2,
            CounterId = 5,
            CalledAt = DateTime.UtcNow
        };

        await _service.BroadcastTokenCalled(payload);

        _mockHubClients.Verify(c => c.Group("queue-2"), Times.Once);
        _mockQueueHubClient.Verify(c => c.TokenCalled(It.Is<TokenCalledEvent>(e => e.TokenId == 10)), Times.Once);
    }

    [Fact]
    public async Task BroadcastTokenServed_SendsToCorrectGroupWithServedPayload()
    {
        var payload = new TokenStatusUpdatedEvent
        {
            TokenId = 20,
            TokenNumber = "A020",
            CenterId = 3,
            CounterId = 8,
            NewStatus = "served",
            ServedAt = DateTime.UtcNow
        };

        await _service.BroadcastTokenServed(payload);

        _mockHubClients.Verify(c => c.Group("queue-3"), Times.Once);
        _mockQueueHubClient.Verify(c => c.TokenStatusUpdated(It.Is<TokenStatusUpdatedEvent>(e =>
            e.TokenId == 20 && e.NewStatus == "served")), Times.Once);
    }

    [Fact]
    public async Task BroadcastTokenSkipped_SendsToCorrectGroupWithSkippedPayload()
    {
        var payload = new TokenStatusUpdatedEvent
        {
            TokenId = 21,
            TokenNumber = "A021",
            CenterId = 3,
            CounterId = 8,
            NewStatus = "skipped",
            SkippedAt = DateTime.UtcNow
        };

        await _service.BroadcastTokenSkipped(payload);

        _mockHubClients.Verify(c => c.Group("queue-3"), Times.Once);
        _mockQueueHubClient.Verify(c => c.TokenStatusUpdated(It.Is<TokenStatusUpdatedEvent>(e =>
            e.TokenId == 21 && e.NewStatus == "skipped")), Times.Once);
    }

    [Fact]
    public async Task BroadcastTokenCancelled_SendsToCorrectGroupWithCancelledPayload()
    {
        var payload = new TokenCancelledEvent
        {
            TokenId = 30,
            TokenNumber = "A030",
            CenterId = 4,
            CounterId = 9,
            CancelledAt = DateTime.UtcNow,
            CancelledBy = "citizen",
            NextWaitingTokenNumber = "A031",
            NewWaitingCount = 7
        };

        await _service.BroadcastTokenCancelled(payload);

        _mockHubClients.Verify(c => c.Group("queue-4"), Times.Once);
        _mockQueueHubClient.Verify(c => c.TokenCancelled(It.Is<TokenCancelledEvent>(e =>
            e.TokenId == 30 && e.CancelledBy == "citizen")), Times.Once);
    }

    [Fact]
    public async Task HubThrowsException_BroadcastServiceCatchesSilently_DoesNotPropagate()
    {
        var payload = new TokenCalledEvent
        {
            TokenId = 11,
            TokenNumber = "A011",
            CenterId = 5,
            CounterId = 1,
            CalledAt = DateTime.UtcNow
        };

        _mockHubClients
            .Setup(c => c.Group("queue-5"))
            .Throws(new Exception("SignalR unavailable"));

        var act = async () => await _service.BroadcastTokenCalled(payload);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task AllEventTypes_BroadcastToCorrectGroupScope()
    {
        var called = new TokenCalledEvent
        {
            TokenId = 100,
            TokenNumber = "A100",
            CenterId = 6,
            CounterId = 2,
            CalledAt = DateTime.UtcNow
        };

        var served = new TokenStatusUpdatedEvent
        {
            TokenId = 101,
            TokenNumber = "A101",
            CenterId = 6,
            CounterId = 2,
            NewStatus = "served",
            ServedAt = DateTime.UtcNow
        };

        var skipped = new TokenStatusUpdatedEvent
        {
            TokenId = 102,
            TokenNumber = "A102",
            CenterId = 6,
            CounterId = 2,
            NewStatus = "skipped",
            SkippedAt = DateTime.UtcNow
        };

        var cancelled = new TokenCancelledEvent
        {
            TokenId = 103,
            TokenNumber = "A103",
            CenterId = 6,
            CounterId = 2,
            CancelledAt = DateTime.UtcNow,
            CancelledBy = "admin",
            NewWaitingCount = 3
        };

        await _service.BroadcastTokenCalled(called);
        await _service.BroadcastTokenServed(served);
        await _service.BroadcastTokenSkipped(skipped);
        await _service.BroadcastTokenCancelled(cancelled);

        _mockHubClients.Verify(c => c.Group("queue-6"), Times.Exactly(4));
    }
}
