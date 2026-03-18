// backend/QueueLanka.Queue/Services/CounterService.cs

using Microsoft.AspNetCore.SignalR;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.Events;
using QueueLanka.Queue.Hubs;
using QueueLanka.Shared.Events;

namespace QueueLanka.Queue.Services;

public class CounterService : ICounterService
{
    private readonly ICounterRepository _counterRepository;
    private readonly ITokenRepository _tokenRepository;
    private readonly IEventBus _eventBus;
    private readonly IHubContext<QueueHub, IQueueHubClient> _hubContext;
    private readonly ILogger<CounterService> _logger;

    public CounterService(
        ICounterRepository counterRepository,
        ITokenRepository tokenRepository,
        IEventBus eventBus,
        IHubContext<QueueHub, IQueueHubClient> hubContext,
        ILogger<CounterService> logger)
    {
        _counterRepository = counterRepository;
        _tokenRepository = tokenRepository;
        _eventBus = eventBus;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<CallNextTokenResponseDto?> CallNextTokenAsync(int counterId)
    {
        // Guard: counter must exist and be Open.
        var isOpen = await _counterRepository.IsCounterOpenAsync(counterId);
        if (!isOpen)
            throw new InvalidOperationException("Counter is closed or does not exist.");

        // Atomically fetch-and-claim the next waiting token.
        var token = await _counterRepository.CallNextTokenAsync(counterId);
        if (token == null)
            return null;

        var calledToken = new CallNextTokenResponseDto
        {
            TokenId     = token.TokenId,
            CenterId    = token.CenterId,
            CounterId   = counterId,
            UserId      = token.UserId,
            TokenNumber = token.TokenNumber,
            IssuedDate  = token.IssuedDate,
            Status      = token.Status,
            IssuedTime  = token.IssuedTime,
            CalledAt    = token.CalledAt ?? DateTime.UtcNow
        };

        var tokenCalledEvent = new TokenCalledEvent
        {
            TokenId = calledToken.TokenId,
            CenterId = calledToken.CenterId,
            CounterId = calledToken.CounterId,
            UserId = calledToken.UserId,
            TokenNumber = calledToken.TokenNumber,
            IssuedDate = calledToken.IssuedDate,
            Status = calledToken.Status,
            IssuedTime = calledToken.IssuedTime,
            CalledAt = calledToken.CalledAt
        };

        try
        {
            await _eventBus.PublishAsync(tokenCalledEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Token was called successfully, but broadcasting TokenCalledEvent failed for token {TokenId}",
                calledToken.TokenId);
        }

        return calledToken;
    }

    /// <inheritdoc/>
    public async Task<UpdateTokenStatusResponseDto> UpdateTokenStatusAsync(int counterId, int tokenId, string status)
    {
        if (!string.Equals(status, "served", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(status, "skipped", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Status must be either 'served' or 'skipped'.");
        }

        var normalizedStatus = status.Trim().ToLowerInvariant();

        var result = await _counterRepository.UpdateTokenStatusAsync(counterId, tokenId, normalizedStatus);

        var response = new UpdateTokenStatusResponseDto
        {
            TokenId = result.Token.TokenId,
            CenterId = result.Token.CenterId,
            CounterId = result.CounterId,
            UserId = result.Token.UserId,
            TokenNumber = result.Token.TokenNumber,
            IssuedDate = result.Token.IssuedDate,
            IssuedTime = result.Token.IssuedTime,
            CalledAt = result.Token.CalledAt,
            ServedAt = string.Equals(normalizedStatus, "served", StringComparison.OrdinalIgnoreCase)
                ? result.Token.ServedTime
                : null,
            Status = normalizedStatus,
            NextTokenId = result.NextTokenId
        };

        string? nextWaitingTokenNumber = null;
        if (result.NextTokenId.HasValue)
        {
            try
            {
                var nextToken = await _tokenRepository.GetByIdAsync(result.NextTokenId.Value);
                nextWaitingTokenNumber = nextToken?.TokenNumber;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to resolve next waiting token number for token id {NextTokenId}",
                    result.NextTokenId.Value);
            }
        }

        var updatedEvent = new TokenStatusUpdatedEvent
        {
            TokenId = response.TokenId,
            TokenNumber = response.TokenNumber,
            CounterId = response.CounterId,
            CenterId = response.CenterId,
            NewStatus = normalizedStatus,
            ServedAt = response.ServedAt,
            SkippedAt = string.Equals(normalizedStatus, "skipped", StringComparison.OrdinalIgnoreCase)
                ? DateTime.UtcNow
                : null,
            NextWaitingTokenNumber = nextWaitingTokenNumber
        };

        try
        {
            await _eventBus.PublishAsync(updatedEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Token status updated in DB, but publishing TokenStatusUpdatedEvent failed for token {TokenId}",
                response.TokenId);
        }

        try
        {
            await QueueHub.BroadcastTokenStatusUpdated(_hubContext, updatedEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Token status updated in DB, but SignalR broadcast failed for token {TokenId}",
                response.TokenId);
        }

        return response;
    }
}
