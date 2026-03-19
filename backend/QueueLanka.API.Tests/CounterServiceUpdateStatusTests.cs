// backend/QueueLanka.API.Tests/CounterServiceUpdateStatusTests.cs

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

public class CounterServiceUpdateStatusTests
{
    private readonly Mock<ICounterRepository> _mockCounterRepository;
    private readonly Mock<IEventBus> _mockEventBus;
    private readonly Mock<ILogger<CounterService>> _mockLogger;
    private readonly Mock<IHubContext<QueueHub>> _mockHubContext;
    private readonly Mock<IHubClients> _mockHubClients;
    private readonly Mock<IClientProxy> _mockClientProxy;
    private readonly CounterService _service;

    public CounterServiceUpdateStatusTests()
    {
        _mockCounterRepository = new Mock<ICounterRepository>();
        _mockEventBus = new Mock<IEventBus>();
        _mockLogger = new Mock<ILogger<CounterService>>();
        _mockHubContext = new Mock<IHubContext<QueueHub>>();
        _mockHubClients = new Mock<IHubClients>();
        _mockClientProxy = new Mock<IClientProxy>();

        _mockHubContext.SetupGet(h => h.Clients).Returns(_mockHubClients.Object);
        _mockHubClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);
        _mockClientProxy
            .Setup(c => c.SendCoreAsync(
                It.IsAny<string>(),
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _service = new CounterService(
            _mockCounterRepository.Object,
            _mockEventBus.Object,
            _mockHubContext.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task UpdateTokenStatus_ValidServedUpdate_ReturnsUpdatedTokenAndPublishesEvent()
    {
        // Arrange
        var token = new Token
        {
            TokenId = 10,
            CenterId = 2,
            UserId = 99,
            TokenNumber = "A010",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow.AddMinutes(-20),
            CalledAt = DateTime.UtcNow.AddMinutes(-10),
            ServedTime = DateTime.UtcNow,
            Status = "Completed"
        };

        _mockCounterRepository
            .Setup(r => r.UpdateTokenStatusAsync(5, 10, "served"))
            .ReturnsAsync((token, 5, (int?)11));

        // Act
        var result = await _service.UpdateTokenStatusAsync(5, 10, "served");

        // Assert
        result.TokenId.Should().Be(10);
        result.CounterId.Should().Be(5);
        result.Status.Should().Be("served");
        result.NextTokenId.Should().Be(11);

        _mockEventBus.Verify(
            e => e.PublishAsync(It.Is<TokenStatusUpdatedEvent>(evt =>
                evt.TokenId == 10 && evt.CounterId == 5 && evt.Status == "served")),
            Times.Once);
    }

    [Fact]
    public async Task UpdateTokenStatus_ValidSkippedUpdate_ReturnsUpdatedTokenAndPublishesEvent()
    {
        // Arrange
        var token = new Token
        {
            TokenId = 12,
            CenterId = 2,
            UserId = 100,
            TokenNumber = "A012",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow.AddMinutes(-15),
            CalledAt = DateTime.UtcNow.AddMinutes(-5),
            Status = "Skipped"
        };

        _mockCounterRepository
            .Setup(r => r.UpdateTokenStatusAsync(5, 12, "skipped"))
            .ReturnsAsync((token, 5, (int?)13));

        // Act
        var result = await _service.UpdateTokenStatusAsync(5, 12, "skipped");

        // Assert
        result.TokenId.Should().Be(12);
        result.Status.Should().Be("skipped");
        result.NextTokenId.Should().Be(13);

        _mockEventBus.Verify(
            e => e.PublishAsync(It.Is<TokenStatusUpdatedEvent>(evt =>
                evt.TokenId == 12 && evt.CounterId == 5 && evt.Status == "skipped")),
            Times.Once);
    }

    [Fact]
    public async Task UpdateTokenStatus_InvalidStatus_ThrowsValidationException()
    {
        // Act
        Func<Task> act = async () => await _service.UpdateTokenStatusAsync(5, 10, "completed");

        // Assert
        await act.Should().ThrowAsync<ArgumentException>();
        _mockCounterRepository.Verify(r => r.UpdateTokenStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>()), Times.Never);
        _mockEventBus.Verify(e => e.PublishAsync(It.IsAny<TokenStatusUpdatedEvent>()), Times.Never);
    }

    [Fact]
    public async Task UpdateTokenStatus_TokenNotInCalledState_ThrowsAppropriateException()
    {
        // Arrange
        _mockCounterRepository
            .Setup(r => r.UpdateTokenStatusAsync(5, 10, "served"))
            .ThrowsAsync(new InvalidOperationException("Token is not in called state."));

        // Act
        Func<Task> act = async () => await _service.UpdateTokenStatusAsync(5, 10, "served");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task UpdateTokenStatus_TokenNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _mockCounterRepository
            .Setup(r => r.UpdateTokenStatusAsync(5, 999, "served"))
            .ThrowsAsync(new KeyNotFoundException("Token not found."));

        // Act
        Func<Task> act = async () => await _service.UpdateTokenStatusAsync(5, 999, "served");

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }
}