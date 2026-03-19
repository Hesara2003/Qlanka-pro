// backend/QueueLanka.API.Tests/CounterServiceReassignTests.cs

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

public class CounterServiceReassignTests
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

    public CounterServiceReassignTests()
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
        _mockQueueHubClient
            .Setup(c => c.TokenReassigned(It.IsAny<TokenReassignedEvent>()))
            .Returns(Task.CompletedTask);

        _service = new CounterService(
            _mockCounterRepository.Object,
            _mockTokenRepository.Object,
            _mockAuditLogRepository.Object,
            _mockEventBus.Object,
            _mockHubContext.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task ReassignToken_ValidRequest_MovesTokenPublishesAndAuditLogs()
    {
        var token = new Token
        {
            TokenId = 10,
            CenterId = 2,
            UserId = 99,
            TokenNumber = "A010",
            Status = "Waiting",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow.AddMinutes(-20),
            QueuePosition = 3
        };

        var reassignedToken = new Token
        {
            TokenId = 10,
            CenterId = 2,
            UserId = 99,
            TokenNumber = "A010",
            Status = "Waiting",
            IssuedDate = token.IssuedDate,
            IssuedTime = token.IssuedTime,
            QueuePosition = 5
        };

        var auditLogged = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);

        _mockTokenRepository.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(token);
        _mockCounterRepository.Setup(r => r.IsCounterOpenAsync(8)).ReturnsAsync(true);
        _mockCounterRepository
            .Setup(r => r.ReassignTokenAsync(10, 5, 8))
            .ReturnsAsync((reassignedToken, 5, 8, DateTime.UtcNow));
        _mockAuditLogRepository
            .Setup(r => r.LogAsync(It.IsAny<AuditLog>()))
            .Callback(() => auditLogged.TrySetResult(true))
            .Returns(Task.CompletedTask);

        var result = await _service.ReassignTokenAsync(5, 10, 8, "Balancing load", 42);

        result.TokenId.Should().Be(10);
        result.SourceCounterId.Should().Be(5);
        result.TargetCounterId.Should().Be(8);
        result.QueuePosition.Should().Be(5);

        _mockCounterRepository.Verify(r => r.ReassignTokenAsync(10, 5, 8), Times.Once);
        _mockEventBus.Verify(e => e.PublishAsync(It.IsAny<TokenReassignedEvent>()), Times.Once);
        _mockQueueHubClient.Verify(c => c.TokenReassigned(It.IsAny<TokenReassignedEvent>()), Times.Once);

        await Task.WhenAny(auditLogged.Task, Task.Delay(500));
        auditLogged.Task.IsCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task ReassignToken_TokenAlreadyServed_ThrowsValidationException()
    {
        _mockTokenRepository.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(new Token
        {
            TokenId = 10,
            Status = "Completed"
        });

        Func<Task> act = async () => await _service.ReassignTokenAsync(5, 10, 8, null, 42);

        await act.Should().ThrowAsync<InvalidOperationException>();
        _mockCounterRepository.Verify(r => r.ReassignTokenAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task ReassignToken_TargetCounterClosed_ThrowsValidationException()
    {
        _mockTokenRepository.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(new Token
        {
            TokenId = 10,
            Status = "Waiting"
        });
        _mockCounterRepository.Setup(r => r.IsCounterOpenAsync(8)).ReturnsAsync(false);

        Func<Task> act = async () => await _service.ReassignTokenAsync(5, 10, 8, null, 42);

        await act.Should().ThrowAsync<InvalidOperationException>();
        _mockCounterRepository.Verify(r => r.ReassignTokenAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task ReassignToken_TokenNotFound_ThrowsNotFoundException()
    {
        _mockTokenRepository.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Token?)null);

        Func<Task> act = async () => await _service.ReassignTokenAsync(5, 999, 8, null, 42);

        await act.Should().ThrowAsync<KeyNotFoundException>();
        _mockCounterRepository.Verify(r => r.ReassignTokenAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task ReassignToken_AuditLogFailure_ReassignmentStillSucceeds()
    {
        var token = new Token
        {
            TokenId = 10,
            CenterId = 2,
            TokenNumber = "A010",
            Status = "Waiting",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow
        };

        _mockTokenRepository.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(token);
        _mockCounterRepository.Setup(r => r.IsCounterOpenAsync(8)).ReturnsAsync(true);
        _mockCounterRepository
            .Setup(r => r.ReassignTokenAsync(10, 5, 8))
            .ReturnsAsync((token, 5, 8, DateTime.UtcNow));
        _mockAuditLogRepository
            .Setup(r => r.LogAsync(It.IsAny<AuditLog>()))
            .ThrowsAsync(new Exception("Audit store unavailable"));

        var result = await _service.ReassignTokenAsync(5, 10, 8, "Load balancing", 42);

        result.TokenId.Should().Be(10);
        _mockCounterRepository.Verify(r => r.ReassignTokenAsync(10, 5, 8), Times.Once);
    }

    [Fact]
    public async Task ReassignToken_BroadcastFailure_ReassignmentStillSucceeds()
    {
        var token = new Token
        {
            TokenId = 10,
            CenterId = 2,
            TokenNumber = "A010",
            Status = "Waiting",
            IssuedDate = DateTime.UtcNow.Date,
            IssuedTime = DateTime.UtcNow
        };

        _mockTokenRepository.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(token);
        _mockCounterRepository.Setup(r => r.IsCounterOpenAsync(8)).ReturnsAsync(true);
        _mockCounterRepository
            .Setup(r => r.ReassignTokenAsync(10, 5, 8))
            .ReturnsAsync((token, 5, 8, DateTime.UtcNow));
        _mockQueueHubClient
            .Setup(c => c.TokenReassigned(It.IsAny<TokenReassignedEvent>()))
            .ThrowsAsync(new Exception("SignalR unavailable"));

        var result = await _service.ReassignTokenAsync(5, 10, 8, "Manual reassignment", 42);

        result.TokenId.Should().Be(10);
        _mockCounterRepository.Verify(r => r.ReassignTokenAsync(10, 5, 8), Times.Once);
    }
}
