// backend/QueueLanka.Queue/Services/CounterService.cs

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Counter;
using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.Events;
using QueueLanka.Queue.Hubs;
using QueueLanka.Queue.Integration;
using QueueLanka.Queue.Models;
using QueueLanka.Shared.Events;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace QueueLanka.Queue.Services;

public class CounterService : ICounterService
{
    private readonly ICounterRepository _counterRepository;
    private readonly ITokenRepository _tokenRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IEventBus _eventBus;
    private readonly IQueueBroadcastService _queueBroadcastService;
    private readonly IServiceCenterClient? _serviceCenterClient;
    private readonly ILogger<CounterService> _logger;

    public CounterService(
        ICounterRepository counterRepository,
        ITokenRepository tokenRepository,
        IAuditLogRepository auditLogRepository,
        IEventBus eventBus,
        IQueueBroadcastService queueBroadcastService,
        ILogger<CounterService> logger,
        IServiceCenterClient? serviceCenterClient = null)
    {
        _counterRepository = counterRepository;
        _tokenRepository = tokenRepository;
        _auditLogRepository = auditLogRepository;
        _eventBus = eventBus;
        _queueBroadcastService = queueBroadcastService;
        _serviceCenterClient = serviceCenterClient;
        _logger = logger;
    }

    public CounterService(
        ICounterRepository counterRepository,
        ITokenRepository tokenRepository,
        IAuditLogRepository auditLogRepository,
        IEventBus eventBus,
        IHubContext<QueueHub, IQueueHubClient> hubContext,
        ILogger<CounterService> logger,
        IServiceCenterClient? serviceCenterClient = null)
        : this(
            counterRepository,
            tokenRepository,
            auditLogRepository,
            eventBus,
            new QueueBroadcastService(hubContext, NullLogger<QueueBroadcastService>.Instance),
            logger,
            serviceCenterClient)
    {
    }

    public async Task<CounterResponseDto> CreateCounterAsync(CreateCounterRequestDto request, int adminUserId)
    {
        if (request.CenterId <= 0)
            throw new ValidationException("CenterId must be greater than 0.");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ValidationException("Counter name is required.");

        await EnsureCenterExistsAsync(request.CenterId);

        var duplicateNameExists = await _counterRepository.CounterNameExistsInCenterAsync(request.Name, request.CenterId);
        if (duplicateNameExists)
            throw new InvalidOperationException("Counter name already exists in this center.");

        if (request.AssignedOfficerUserId.HasValue)
        {
            if (request.AssignedOfficerUserId.Value <= 0)
                throw new ValidationException("AssignedOfficerUserId must be greater than 0.");

            var isOfficer = await _counterRepository.IsOfficerUserAsync(request.AssignedOfficerUserId.Value);
            if (!isOfficer)
                throw new ValidationException("Assigned officer must have Officer role.");
        }

        var created = await _counterRepository.CreateCounterAsync(
            request.Name,
            request.CenterId,
            request.AssignedOfficerUserId);

        _ = Task.Run(async () =>
        {
            try
            {
                var details = JsonSerializer.Serialize(new
                {
                    created.CounterId,
                    created.Name,
                    created.CenterId,
                    created.AssignedOfficerUserId
                });

                await _auditLogRepository.LogAsync(new AuditLog
                {
                    Action = "CounterCreated",
                    EntityType = "Counter",
                    EntityId = created.CounterId,
                    PerformedBy = adminUserId,
                    PerformedAt = DateTime.UtcNow,
                    Details = details,
                    CenterId = created.CenterId
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Audit logging failed for counter creation {CounterId}", created.CounterId);
            }
        });

        return created;
    }

    public async Task<ListCountersResponseDto> GetCountersByCenterAsync(int centerId, int adminUserId)
    {
        _ = adminUserId;

        await EnsureCenterExistsAsync(centerId);

        var counters = await _counterRepository.GetCountersByCenterAsync(centerId);

        return new ListCountersResponseDto
        {
            Counters = counters,
            TotalCount = counters.Count,
            CenterId = centerId,
            OpenCount = counters.Count(c => c.IsOpen),
            ClosedCount = counters.Count(c => !c.IsOpen)
        };
    }

    public async Task<CounterResponseDto> GetCounterByIdAsync(int centerId, int counterId, int adminUserId)
    {
        _ = adminUserId;

        await EnsureCenterExistsAsync(centerId);

        var exists = await _counterRepository.CounterExistsAsync(counterId, centerId);
        if (!exists)
            throw new KeyNotFoundException("Counter not found.");

        var counter = await _counterRepository.GetCounterByIdAsync(counterId);
        if (counter == null)
            throw new KeyNotFoundException("Counter not found.");

        return counter;
    }

    public async Task<CounterResponseDto> UpdateCounterStatusAsync(int centerId, int counterId, UpdateCounterStatusRequestDto request, int adminUserId)
    {
        await EnsureCenterExistsAsync(centerId);

        var exists = await _counterRepository.CounterExistsAsync(counterId, centerId);
        if (!exists)
            throw new KeyNotFoundException("Counter not found.");

        var queueState = await _counterRepository.GetCounterQueueStateAsync(counterId);

        var updated = await _counterRepository.UpdateCounterStatusAsync(counterId, request.IsOpen, request.Reason);
        if (updated == null)
            throw new KeyNotFoundException("Counter not found.");

        if (!request.IsOpen)
        {
            if (queueState.WaitingCount > 0)
            {
                updated.WarningMessage = $"Counter closed with {queueState.WaitingCount} waiting token(s).";
            }

            if (queueState.HasCalledToken)
            {
                updated.WarningMessage = string.IsNullOrWhiteSpace(updated.WarningMessage)
                    ? "Counter closed while a called token is pending service."
                    : $"{updated.WarningMessage} Called token is still pending service.";
            }
        }

        await BroadcastCounterStatusChangedAsync(updated.CounterId, updated.CenterId, updated.IsOpen, updated.Name);

        _ = Task.Run(async () =>
        {
            try
            {
                var details = JsonSerializer.Serialize(new
                {
                    updated.CounterId,
                    updated.CenterId,
                    updated.IsOpen,
                    request.Reason,
                    updated.WarningMessage
                });

                await _auditLogRepository.LogAsync(new AuditLog
                {
                    Action = "CounterStatusChanged",
                    EntityType = "Counter",
                    EntityId = updated.CounterId,
                    PerformedBy = adminUserId,
                    PerformedAt = DateTime.UtcNow,
                    Details = details,
                    CenterId = updated.CenterId
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Audit logging failed for counter status update {CounterId}", updated.CounterId);
            }
        });

        return updated;
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
            if (string.Equals(normalizedStatus, "served", StringComparison.OrdinalIgnoreCase))
            {
                await _queueBroadcastService.BroadcastTokenServed(updatedEvent);
            }
            else
            {
                await _queueBroadcastService.BroadcastTokenSkipped(updatedEvent);
            }
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
            await _queueBroadcastService.BroadcastTokenReassigned(reassignedEvent);
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
            await _queueBroadcastService.BroadcastCounterStatusChanged(payload);
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

            await _queueBroadcastService.BroadcastQueueUpdated(payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Queue state updated in DB, but QueueUpdatedEvent broadcast failed for counter {CounterId}",
                counterId);
        }
    }

    private async Task EnsureCenterExistsAsync(int centerId)
    {
        if (centerId <= 0)
            throw new ValidationException("CenterId must be greater than 0.");

        if (_serviceCenterClient == null)
            return;

        var center = await _serviceCenterClient.GetCenterAsync(centerId);
        if (center == null)
            throw new KeyNotFoundException("Center not found.");
    }
}
