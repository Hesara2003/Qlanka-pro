// backend/QueueLanka.Queue/Services/CounterService.cs

using Microsoft.AspNetCore.SignalR;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.Events;
using QueueLanka.Queue.Hubs;
using QueueLanka.Queue.Models;
using QueueLanka.Shared.Events;
using System.Text.Json;

namespace QueueLanka.Queue.Services;

public class CounterService : ICounterService
{
    private readonly ICounterRepository _counterRepository;
    private readonly ITokenRepository _tokenRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IEventBus _eventBus;
    private readonly IHubContext<QueueHub, IQueueHubClient> _hubContext;
    private readonly ILogger<CounterService> _logger;

    public CounterService(
        ICounterRepository counterRepository,
        ITokenRepository tokenRepository,
        IAuditLogRepository auditLogRepository,
        IEventBus eventBus,
        IHubContext<QueueHub, IQueueHubClient> hubContext,
        ILogger<CounterService> logger)
    {
        _counterRepository = counterRepository;
        _tokenRepository = tokenRepository;
        _auditLogRepository = auditLogRepository;
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

    /// <inheritdoc/>
    public async Task<ReassignTokenResponseDto> ReassignTokenAsync(
        int sourceCounterId,
        int tokenId,
        int targetCounterId,
        string? reason,
        int performedByUserId)
    {
        if (sourceCounterId <= 0)
            throw new ArgumentException("Source counter id must be greater than zero.");

        if (targetCounterId <= 0)
            throw new ArgumentException("Target counter id must be greater than zero.");

        if (tokenId <= 0)
            throw new ArgumentException("Token id must be greater than zero.");

        if (sourceCounterId == targetCounterId)
            throw new ArgumentException("Source and target counters must be different.");

        var token = await _tokenRepository.GetByIdAsync(tokenId);
        if (token == null)
            throw new KeyNotFoundException("Token not found.");

        if (string.Equals(token.Status, "Served", StringComparison.OrdinalIgnoreCase)
            || string.Equals(token.Status, "Skipped", StringComparison.OrdinalIgnoreCase)
            || string.Equals(token.Status, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Token already served/skipped and cannot be reassigned.");
        }

        if (!string.Equals(token.Status, "Waiting", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(token.Status, "Called", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Only waiting or called tokens can be reassigned.");
        }

        var isTargetOpen = await _counterRepository.IsCounterOpenAsync(targetCounterId);
        if (!isTargetOpen)
            throw new InvalidOperationException("Target counter is closed.");

        var result = await _counterRepository.ReassignTokenAsync(tokenId, sourceCounterId, targetCounterId);

        var response = new ReassignTokenResponseDto
        {
            TokenId = result.Token.TokenId,
            CenterId = result.Token.CenterId,
            UserId = result.Token.UserId,
            TokenNumber = result.Token.TokenNumber,
            Status = result.Token.Status,
            IssuedDate = result.Token.IssuedDate,
            IssuedTime = result.Token.IssuedTime,
            QueuePosition = result.Token.QueuePosition,
            SourceCounterId = result.SourceCounterId,
            TargetCounterId = result.TargetCounterId,
            ReassignedAt = result.ReassignedAt
        };

        var reassignedEvent = new TokenReassignedEvent
        {
            TokenId = response.TokenId,
            TokenNumber = response.TokenNumber,
            CenterId = response.CenterId,
            SourceCounterId = response.SourceCounterId,
            TargetCounterId = response.TargetCounterId,
            ReassignedAt = response.ReassignedAt,
            Reason = reason
        };

        try
        {
            await _eventBus.PublishAsync(reassignedEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Token reassigned in DB, but publishing TokenReassignedEvent failed for token {TokenId}",
                response.TokenId);
        }

        try
        {
            await QueueHub.BroadcastTokenReassigned(_hubContext, reassignedEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Token reassigned in DB, but SignalR reassignment broadcast failed for token {TokenId}",
                response.TokenId);
        }

        _ = Task.Run(async () =>
        {
            try
            {
                var details = JsonSerializer.Serialize(new
                {
                    response.TokenId,
                    response.TokenNumber,
                    response.SourceCounterId,
                    response.TargetCounterId,
                    response.ReassignedAt,
                    Reason = reason
                });

                var entry = new AuditLog
                {
                    Action = "TokenReassigned",
                    EntityType = "Token",
                    EntityId = response.TokenId,
                    PerformedBy = performedByUserId,
                    PerformedAt = DateTime.UtcNow,
                    Details = details,
                    CenterId = response.CenterId
                };

                await _auditLogRepository.LogAsync(entry);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Audit logging failed for token reassignment {TokenId}",
                    response.TokenId);
            }
        });

        return response;
    }
}
