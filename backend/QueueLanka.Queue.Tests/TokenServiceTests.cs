using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.Integration;
using QueueLanka.Queue.Models;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.Events;

namespace QueueLanka.Queue.Tests;

public class TokenServiceTests
{
    private readonly Mock<ITokenRepository> _tokens = new();
    private readonly Mock<IServiceCenterClient> _centers = new();
    private readonly Mock<IEventBus> _events = new();
    private readonly Mock<IQueueBroadcastService> _broadcast = new();

    private TokenService CreateService()
        => new(_tokens.Object, _centers.Object, _events.Object, _broadcast.Object, NullLogger<TokenService>.Instance);

    [Fact]
    public async Task GetUserTokensAsync_SkipsTokensWithMissingCenter()
    {
        _tokens.Setup(x => x.GetByUserIdAsync(1)).ReturnsAsync(new List<Token>
        {
            new() { TokenId = 1, CenterId = 999, TokenNumber = "A001", IssuedDate = DateTime.Today, IssuedTime = DateTime.UtcNow, Status = "Waiting" }
        });
        _centers.Setup(x => x.GetCenterAsync(999)).ReturnsAsync((ServiceCenterDto?)null);

        var service = CreateService();
        var result = (await service.GetUserTokensAsync(1)).ToList();

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetUserTokensAsync_WaitingToken_ComputesQueuePositionAndEtaCappedToClosing()
    {
        var issuedDate = DateTime.Today.AddDays(1);

        _tokens.Setup(x => x.GetByUserIdAsync(10)).ReturnsAsync(new List<Token>
        {
            new() { TokenId = 2, CenterId = 5, TokenNumber = "A002", IssuedDate = issuedDate, IssuedTime = issuedDate.AddHours(9), Status = "Waiting" }
        });
        _centers.Setup(x => x.GetCenterAsync(5)).ReturnsAsync(new ServiceCenterDto
        {
            CenterId = 5,
            Name = "Center A",
            OpeningTime = new TimeSpan(9, 0, 0),
            ClosingTime = new TimeSpan(9, 30, 0),
            AverageServiceTimeMinutes = 20
        });
        _tokens.Setup(x => x.GetByCenterAndDateAsync(5, issuedDate)).ReturnsAsync(new List<Token>
        {
            new() { TokenId = 1, CenterId = 5, IssuedDate = issuedDate, IssuedTime = issuedDate.AddHours(9), Status = "Waiting" },
            new() { TokenId = 2, CenterId = 5, IssuedDate = issuedDate, IssuedTime = issuedDate.AddHours(9).AddMinutes(1), Status = "Waiting" }
        });
        _centers.Setup(x => x.GetAvailabilityAsync(5, issuedDate)).ReturnsAsync((CenterAvailabilityDto?)null);

        var service = CreateService();
        var result = (await service.GetUserTokensAsync(10)).Single();

        result.QueuePosition.Should().Be(1);
        result.ETA.Should().NotBeNull();
        result.ETA!.Value.TimeOfDay.Should().Be(new TimeSpan(9, 20, 0));
    }

    [Fact]
    public async Task CancelTokenAsync_WhenTokenMissing_ReturnsTokenNotFound()
    {
        _tokens.Setup(x => x.GetByIdAsync(55)).ReturnsAsync((Token?)null);

        var service = CreateService();
        var result = await service.CancelTokenAsync(55, userId: 1, isAdmin: false);

        result.Should().Be(CancellationResult.TokenNotFound);
    }

    [Fact]
    public async Task CancelTokenAsync_WhenOwnerMismatchAndNotAdmin_ReturnsTokenNotFound()
    {
        _tokens.Setup(x => x.GetByIdAsync(10)).ReturnsAsync(new Token
        {
            TokenId = 10,
            UserId = 99,
            Status = "Waiting"
        });

        var service = CreateService();
        var result = await service.CancelTokenAsync(10, userId: 1, isAdmin: false);

        result.Should().Be(CancellationResult.TokenNotFound);
    }

    [Fact]
    public async Task CancelTokenAsync_WhenAlreadyCancelled_ReturnsAlreadyCancelled()
    {
        _tokens.Setup(x => x.GetByIdAsync(10)).ReturnsAsync(new Token
        {
            TokenId = 10,
            UserId = 1,
            Status = "Cancelled"
        });

        var service = CreateService();
        var result = await service.CancelTokenAsync(10, userId: 1, isAdmin: false);

        result.Should().Be(CancellationResult.AlreadyCancelled);
    }

    [Fact]
    public async Task CancelTokenAsync_WhenStatusIsNotWaiting_ReturnsNotCancellable()
    {
        _tokens.Setup(x => x.GetByIdAsync(10)).ReturnsAsync(new Token
        {
            TokenId = 10,
            UserId = 1,
            Status = "Completed"
        });

        var service = CreateService();
        var result = await service.CancelTokenAsync(10, userId: 1, isAdmin: false);

        result.Should().Be(CancellationResult.NotCancellable);
    }

    [Fact]
    public async Task CancelTokenAsync_WhenAtomicCancelFails_ReturnsNotCancellable()
    {
        _tokens.Setup(x => x.GetByIdAsync(10)).ReturnsAsync(new Token
        {
            TokenId = 10,
            UserId = 1,
            Status = "Waiting"
        });
        _tokens.Setup(x => x.CancelAndShiftQueueAsync(10, 1, false)).ReturnsAsync(false);

        var service = CreateService();
        var result = await service.CancelTokenAsync(10, userId: 1, isAdmin: false);

        result.Should().Be(CancellationResult.NotCancellable);
    }

    [Fact]
    public async Task CancelTokenAsync_Success_PublishesAndBroadcasts()
    {
        var cancelledToken = new Token
        {
            TokenId = 10,
            UserId = 1,
            CenterId = 7,
            IssuedDate = DateTime.Today,
            TokenNumber = "A010",
            Status = "Cancelled",
            CancelledAt = DateTime.UtcNow
        };

        _tokens.SetupSequence(x => x.GetByIdAsync(10))
            .ReturnsAsync(new Token
            {
                TokenId = 10,
                UserId = 1,
                CenterId = 7,
                IssuedDate = DateTime.Today,
                TokenNumber = "A010",
                Status = "Waiting"
            })
            .ReturnsAsync(cancelledToken);
        _tokens.Setup(x => x.CancelAndShiftQueueAsync(10, 1, false)).ReturnsAsync(true);
        _tokens.Setup(x => x.GetByCenterAndDateAsync(7, cancelledToken.IssuedDate)).ReturnsAsync(new List<Token>());

        var service = CreateService();
        var result = await service.CancelTokenAsync(10, userId: 1, isAdmin: false);

        result.Should().Be(CancellationResult.Success);
        _events.Verify(x => x.PublishAsync(It.IsAny<QueueLanka.Queue.Events.TokenCancelledEvent>()), Times.Once);
        _broadcast.Verify(x => x.BroadcastTokenCancelled(It.IsAny<QueueLanka.Queue.Events.TokenCancelledEvent>()), Times.Once);
    }
}
