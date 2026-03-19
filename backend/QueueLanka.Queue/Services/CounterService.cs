// backend/QueueLanka.Queue/Services/CounterService.cs

using Microsoft.AspNetCore.SignalR;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Counter;
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

            await BroadcastQueueUpdatedAsync(counterId, calledToken.CenterId, "TokenCalled");

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

        var triggerAction = string.Equals(normalizedStatus, "served", StringComparison.OrdinalIgnoreCase)
            ? "TokenServed"
            : "TokenSkipped";

        await BroadcastQueueUpdatedAsync(counterId, response.CenterId, triggerAction);

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

            await BroadcastQueueUpdatedAsync(response.SourceCounterId, response.CenterId, "TokenReassigned");
            await BroadcastQueueUpdatedAsync(response.TargetCounterId, response.CenterId, "TokenReassigned");

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

    public async Task BroadcastCounterStatusChangedAsync(int counterId, int centerId, bool isOpen, string counterName)
    {
        var payload = new CounterStatusEvent
        {
            CounterId = counterId,
            CenterId = centerId,
            IsOpen = isOpen,
            CounterName = counterName,
            ChangedAt = DateTime.UtcNow
        };

        try
        {
            await QueueHub.BroadcastCounterStatusChanged(_hubContext, payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Counter status changed in DB, but SignalR status broadcast failed for counter {CounterId}",
                payload.CounterId);
        }
    }

    /// <inheritdoc/>
    public async Task<CounterDashboardDto> GetDashboardAsync(int counterId, int officerUserId)
    {
        var dashboardData = await _counterRepository.GetCounterDashboardAsync(counterId);
        if (!dashboardData.HasValue)
        {
            throw new KeyNotFoundException("Counter not found.");
        }

        ValidateOfficerAssignment(dashboardData.Value.AssignedOfficerUserId, officerUserId);

        var waitingTokens = await _counterRepository.GetWaitingTokensAsync(counterId);
        var servedCount = await _counterRepository.GetServedCountTodayAsync(counterId);
        var skippedCount = await _counterRepository.GetSkippedCountTodayAsync(counterId);
        var averageServiceTimeSeconds = await _counterRepository.GetAverageServiceTimeAsync(counterId);

        var waitingTokenDtos = MapWaitingTokens(waitingTokens, averageServiceTimeSeconds);

        return new CounterDashboardDto
        {
            CounterId = dashboardData.Value.CounterId,
            CounterName = dashboardData.Value.CounterName,
            IsOpen = dashboardData.Value.IsOpen,
            CurrentToken = MapCurrentToken(dashboardData.Value.CurrentToken),
            WaitingTokens = waitingTokenDtos,
            ServedCount = servedCount,
            SkippedCount = skippedCount,
            AverageServiceTimeSeconds = averageServiceTimeSeconds
        };
    }

    /// <inheritdoc/>
    public async Task<IReadOnlyList<WaitingTokenDto>> GetWaitingTokensAsync(int counterId, int officerUserId)
    {
        var dashboardData = await _counterRepository.GetCounterDashboardAsync(counterId);
        if (!dashboardData.HasValue)
        {
            throw new KeyNotFoundException("Counter not found.");
        }

        ValidateOfficerAssignment(dashboardData.Value.AssignedOfficerUserId, officerUserId);

        var waitingTokens = await _counterRepository.GetWaitingTokensAsync(counterId);
        var averageServiceTimeSeconds = await _counterRepository.GetAverageServiceTimeAsync(counterId);

        return MapWaitingTokens(waitingTokens, averageServiceTimeSeconds);
    }

    private static void ValidateOfficerAssignment(int? assignedOfficerUserId, int officerUserId)
    {
        if (officerUserId <= 0)
        {
            return;
        }

        if (!assignedOfficerUserId.HasValue || assignedOfficerUserId.Value != officerUserId)
        {
            throw new UnauthorizedAccessException("Officer is not assigned to this counter.");
        }
    }

    private static CurrentTokenDto? MapCurrentToken(Token? token)
    {
        if (token == null)
        {
            return null;
        }

        var calledAt = token.CalledAt;
        var waitedSeconds = 0;

        if (calledAt.HasValue)
        {
            waitedSeconds = Math.Max(0, (int)(calledAt.Value - token.IssuedTime).TotalSeconds);
        }

        return new CurrentTokenDto
        {
            TokenId = token.TokenId,
            TokenNumber = token.TokenNumber,
            Status = token.Status,
            CalledAt = calledAt,
            WaitedSeconds = waitedSeconds
        };
    }

    private static List<WaitingTokenDto> MapWaitingTokens(IReadOnlyList<Token> waitingTokens, int averageServiceTimeSeconds)
    {
        var mapped = new List<WaitingTokenDto>(waitingTokens.Count);

        for (var index = 0; index < waitingTokens.Count; index++)
        {
            var token = waitingTokens[index];
            var queuePosition = token.QueuePosition.GetValueOrDefault(index + 1);
            if (queuePosition <= 0)
            {
                queuePosition = index + 1;
            }

            mapped.Add(new WaitingTokenDto
            {
                TokenId = token.TokenId,
                TokenNumber = token.TokenNumber,
                QueuePosition = queuePosition,
                IssuedAt = token.IssuedTime,
                EstimatedWaitSeconds = queuePosition * Math.Max(0, averageServiceTimeSeconds)
            });
        }

        return mapped;
    }

    private async Task BroadcastQueueUpdatedAsync(int counterId, int fallbackCenterId, string triggerAction)
    {
        try
        {
            var waitingTokens = await _counterRepository.GetWaitingTokensAsync(counterId);
            var servedCountToday = await _counterRepository.GetServedCountTodayAsync(counterId);
            var skippedCountToday = await _counterRepository.GetSkippedCountTodayAsync(counterId);
            var averageServiceTimeSeconds = await _counterRepository.GetAverageServiceTimeAsync(counterId);
            var waitingTokenDtos = MapWaitingTokens(waitingTokens, averageServiceTimeSeconds);

            var payload = new QueueUpdatedEvent
            {
                CounterId = counterId,
                CenterId = fallbackCenterId,
                WaitingTokens = waitingTokenDtos,
                WaitingCount = waitingTokenDtos.Count,
                ServedCountToday = servedCountToday,
                SkippedCountToday = skippedCountToday,
                Timestamp = DateTime.UtcNow,
                TriggerAction = triggerAction
            };

            await QueueHub.BroadcastQueueUpdated(_hubContext, payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Queue state updated in DB, but QueueUpdatedEvent broadcast failed for counter {CounterId}",
                counterId);
        }
    }
}
