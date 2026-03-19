// backend/QueueLanka.API.Tests/CounterDashboardServiceTests.cs

using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.Hubs;
using QueueLanka.Queue.Models;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.Events;

namespace QueueLanka.API.Tests;

public class CounterDashboardServiceTests
{
    private readonly Mock<ICounterRepository> _mockCounterRepository;
    private readonly Mock<ITokenRepository> _mockTokenRepository;
    private readonly Mock<IAuditLogRepository> _mockAuditLogRepository;
    private readonly Mock<IEventBus> _mockEventBus;
    private readonly Mock<IHubContext<QueueHub, IQueueHubClient>> _mockHubContext;
    private readonly Mock<ILogger<CounterService>> _mockLogger;
    private readonly CounterService _service;

    public CounterDashboardServiceTests()
    {
        _mockCounterRepository = new Mock<ICounterRepository>();
        _mockTokenRepository = new Mock<ITokenRepository>();
        _mockAuditLogRepository = new Mock<IAuditLogRepository>();
        _mockEventBus = new Mock<IEventBus>();
        _mockHubContext = new Mock<IHubContext<QueueHub, IQueueHubClient>>();
        _mockLogger = new Mock<ILogger<CounterService>>();

        _service = new CounterService(
            _mockCounterRepository.Object,
            _mockTokenRepository.Object,
            _mockAuditLogRepository.Object,
            _mockEventBus.Object,
            _mockHubContext.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task GetDashboardAsync_ValidOfficer_ReturnsDashboardData()
    {
        var currentToken = new Token
        {
            TokenId = 100,
            TokenNumber = "A100",
            Status = "Called",
            IssuedTime = DateTime.UtcNow.AddMinutes(-8),
            CalledAt = DateTime.UtcNow.AddMinutes(-1)
        };

        var waitingTokens = new List<Token>
        {
            new()
            {
                TokenId = 101,
                TokenNumber = "A101",
                QueuePosition = 1,
                IssuedTime = DateTime.UtcNow.AddMinutes(-6)
            },
            new()
            {
                TokenId = 102,
                TokenNumber = "A102",
                QueuePosition = 2,
                IssuedTime = DateTime.UtcNow.AddMinutes(-5)
            }
        };

        _mockCounterRepository
            .Setup(r => r.GetCounterDashboardAsync(5))
            .ReturnsAsync((5, "Counter 5", true, 99, currentToken));
        _mockCounterRepository
            .Setup(r => r.GetWaitingTokensAsync(5))
            .ReturnsAsync(waitingTokens);
        _mockCounterRepository
            .Setup(r => r.GetServedCountTodayAsync(5))
            .ReturnsAsync(12);
        _mockCounterRepository
            .Setup(r => r.GetSkippedCountTodayAsync(5))
            .ReturnsAsync(2);
        _mockCounterRepository
            .Setup(r => r.GetAverageServiceTimeAsync(5))
            .ReturnsAsync(30);

        var result = await _service.GetDashboardAsync(5, 99);

        result.CounterId.Should().Be(5);
        result.CounterName.Should().Be("Counter 5");
        result.CurrentToken.Should().NotBeNull();
        result.WaitingTokens.Should().HaveCount(2);
        result.ServedCount.Should().Be(12);
        result.SkippedCount.Should().Be(2);
        result.AverageServiceTimeSeconds.Should().Be(30);
        result.WaitingTokens[0].EstimatedWaitSeconds.Should().Be(30);
        result.WaitingTokens[1].EstimatedWaitSeconds.Should().Be(60);
    }

    [Fact]
    public async Task GetDashboardAsync_WrongOfficer_ThrowsForbidden()
    {
        _mockCounterRepository
            .Setup(r => r.GetCounterDashboardAsync(5))
            .ReturnsAsync((5, "Counter 5", true, 200, (Token?)null));

        Func<Task> act = async () => await _service.GetDashboardAsync(5, 99);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*not assigned*");
    }

    [Fact]
    public async Task GetDashboardAsync_CounterNotFound_ThrowsNotFound()
    {
        _mockCounterRepository
            .Setup(r => r.GetCounterDashboardAsync(5))
            .ReturnsAsync(((int CounterId, string CounterName, bool IsOpen, int? AssignedOfficerUserId, Token? CurrentToken)?)null);

        Func<Task> act = async () => await _service.GetDashboardAsync(5, 99);

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*Counter not found*");
    }

    [Fact]
    public async Task GetWaitingTokensAsync_NoWaitingTokens_ReturnsEmptyList()
    {
        _mockCounterRepository
            .Setup(r => r.GetCounterDashboardAsync(5))
            .ReturnsAsync((5, "Counter 5", true, 99, (Token?)null));
        _mockCounterRepository
            .Setup(r => r.GetWaitingTokensAsync(5))
            .ReturnsAsync(new List<Token>());
        _mockCounterRepository
            .Setup(r => r.GetAverageServiceTimeAsync(5))
            .ReturnsAsync(25);

        var result = await _service.GetWaitingTokensAsync(5, 99);

        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetDashboardAsync_NoServedTokensToday_ReturnsZeroServedCount()
    {
        _mockCounterRepository
            .Setup(r => r.GetCounterDashboardAsync(5))
            .ReturnsAsync((5, "Counter 5", true, 99, (Token?)null));
        _mockCounterRepository
            .Setup(r => r.GetWaitingTokensAsync(5))
            .ReturnsAsync(new List<Token>());
        _mockCounterRepository
            .Setup(r => r.GetServedCountTodayAsync(5))
            .ReturnsAsync(0);
        _mockCounterRepository
            .Setup(r => r.GetSkippedCountTodayAsync(5))
            .ReturnsAsync(1);
        _mockCounterRepository
            .Setup(r => r.GetAverageServiceTimeAsync(5))
            .ReturnsAsync(20);

        var result = await _service.GetDashboardAsync(5, 99);

        result.ServedCount.Should().Be(0);
    }

    [Fact]
    public async Task GetDashboardAsync_AverageServiceTimeNoData_ReturnsZeroWithoutErrors()
    {
        var waitingTokens = new List<Token>
        {
            new()
            {
                TokenId = 101,
                TokenNumber = "A101",
                QueuePosition = 1,
                IssuedTime = DateTime.UtcNow.AddMinutes(-3)
            }
        };

        _mockCounterRepository
            .Setup(r => r.GetCounterDashboardAsync(5))
            .ReturnsAsync((5, "Counter 5", true, 99, (Token?)null));
        _mockCounterRepository
            .Setup(r => r.GetWaitingTokensAsync(5))
            .ReturnsAsync(waitingTokens);
        _mockCounterRepository
            .Setup(r => r.GetServedCountTodayAsync(5))
            .ReturnsAsync(0);
        _mockCounterRepository
            .Setup(r => r.GetSkippedCountTodayAsync(5))
            .ReturnsAsync(0);
        _mockCounterRepository
            .Setup(r => r.GetAverageServiceTimeAsync(5))
            .ReturnsAsync(0);

        var result = await _service.GetDashboardAsync(5, 99);

        result.AverageServiceTimeSeconds.Should().Be(0);
        result.WaitingTokens.Should().ContainSingle();
        result.WaitingTokens[0].EstimatedWaitSeconds.Should().Be(0);
    }
}
