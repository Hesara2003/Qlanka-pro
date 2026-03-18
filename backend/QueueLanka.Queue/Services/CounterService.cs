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
    private readonly IEventBus _eventBus;
    private readonly IHubContext<QueueHub> _hubContext;
    private readonly ILogger<CounterService> _logger;

    public CounterService(
        ICounterRepository counterRepository,
        IEventBus eventBus,
        IHubContext<QueueHub> hubContext,
        ILogger<CounterService> logger)
    {
        _counterRepository = counterRepository;
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

        var updatedEvent = new TokenStatusUpdatedEvent
        {
            TokenId = response.TokenId,
            CenterId = response.CenterId,
            CounterId = response.CounterId,
            UserId = response.UserId,
            TokenNumber = response.TokenNumber,
            IssuedDate = response.IssuedDate,
            IssuedTime = response.IssuedTime,
            CalledAt = response.CalledAt,
            ServedAt = response.ServedAt,
            Status = response.Status
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
            var groupName = QueueHub.GetCenterGroupName(response.CenterId);
            await _hubContext.Clients.Group(groupName).SendAsync("TokenStatusUpdated", updatedEvent);
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
