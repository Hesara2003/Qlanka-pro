// backend/QueueLanka.Queue/Services/TokenService.cs

using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.Events;
using QueueLanka.Queue.Integration;
using QueueLanka.Shared.Events;
using QueueTokenCancelledEvent = QueueLanka.Queue.Events.TokenCancelledEvent;

namespace QueueLanka.Queue.Services;

public class TokenService : ITokenService
{
    private readonly ITokenRepository _tokenRepository;
    private readonly IServiceCenterClient _serviceCenterClient;
    private readonly IEventBus _eventBus;
    private readonly IQueueBroadcastService _queueBroadcastService;
    private readonly ILogger<TokenService> _logger;

    public TokenService(
        ITokenRepository tokenRepository,
        IServiceCenterClient serviceCenterClient,
        IEventBus eventBus,
        IQueueBroadcastService queueBroadcastService,
        ILogger<TokenService> logger)
    {
        _tokenRepository = tokenRepository;
        _serviceCenterClient = serviceCenterClient;
        _eventBus = eventBus;
        _queueBroadcastService = queueBroadcastService;
        _logger = logger;
    }

    public async Task<IEnumerable<UserTokenResponseDto>> GetUserTokensAsync(int userId)
    {
        var tokens = await _tokenRepository.GetByUserIdAsync(userId);
        var responseTokens = new List<UserTokenResponseDto>();

        foreach (var token in tokens)
        {
            var center = await _serviceCenterClient.GetCenterAsync(token.CenterId);
            if (center == null) continue;

            int? queuePosition = null;
            DateTime? eta = null;

            if (token.Status == "Waiting")
            {
                var centerTokens = await _tokenRepository.GetByCenterAndDateAsync(token.CenterId, token.IssuedDate);
                var unservedTokens = centerTokens.Where(t => t.Status == "Waiting").OrderBy(t => t.IssuedTime).ToList();

                int position = unservedTokens.FindIndex(t => t.TokenId == token.TokenId);

                if (position >= 0) // Token is in the queue
                {
                    queuePosition = position; // Number of people ahead

                    // Calculate ETA
                    var availability = await _serviceCenterClient.GetAvailabilityAsync(token.CenterId, token.IssuedDate);
                    var openingTime = availability?.OpeningTime ?? center.OpeningTime;
                    var closingTime = availability?.ClosingTime ?? center.ClosingTime;
                    
                    var avgServiceTime = center.AverageServiceTimeMinutes;
                    if (avgServiceTime > 0)
                    {
                        // Use the later of OpeningTime today or current time (if today)
                        // Note: For simplicity, comparing DateTime.Now with IssuedDate
                        var baseTime = DateTime.Now;
                        if (baseTime.Date < token.IssuedDate.Date)
                        {
                            baseTime = token.IssuedDate.Date.Add(openingTime);
                        }
                        else if (baseTime.Date == token.IssuedDate.Date && baseTime.TimeOfDay < openingTime)
                        {
                            baseTime = token.IssuedDate.Date.Add(openingTime);
                        }

                        eta = baseTime.AddMinutes(queuePosition.Value * avgServiceTime);
                        
                        // Ensure ETA does not exceed the center's closing time
                        var closingDateTime = token.IssuedDate.Date.Add(closingTime);
                        if(eta > closingDateTime)
                        {
                            eta = closingDateTime;
                        }

                    }
                }
            }

            responseTokens.Add(new UserTokenResponseDto
            {
                TokenId = token.TokenId,
                CenterId = token.CenterId,
                CenterName = center.Name,
                TokenNumber = token.TokenNumber,
                IssuedDate = token.IssuedDate,
                Status = token.Status,
                IssuedTime = token.IssuedTime,
                EstimatedServiceTime = token.EstimatedServiceTime,
                ServedTime = token.ServedTime,
                CompletedTime = token.CompletedTime,
                QueuePosition = queuePosition,
                ETA = eta
            });
        }


        return responseTokens;
    }

    public async Task<CancellationResult> CancelTokenAsync(int tokenId, int userId, bool isAdmin = false)
    {
        // Fetch the token first so we can distinguish "not found / not mine" from
        // "found but not in a cancellable state".
        var token = await _tokenRepository.GetByIdAsync(tokenId);

        // Token doesn't exist at all.
        if (token == null)
            return CancellationResult.TokenNotFound;

        // Token belongs to a different user — if the caller is not an admin, treat 
        // the same as not found to avoid leaking whether the ID is valid to the caller.
        if (!isAdmin && token.UserId != userId)
            return CancellationResult.TokenNotFound;

        // Token is already in a terminal cancelled state.
        if (token.Status == "Cancelled")
            return CancellationResult.AlreadyCancelled;

        // Token is being served or has been completed/skipped — cannot cancel.
        if (token.Status != "Waiting")
            return CancellationResult.NotCancellable;

        // Attempt the atomic cancel + queue-shift.  A false return value here
        // means a concurrent update changed the status between our read and the
        // stored-procedure check (e.g. the officer started serving it).
        var cancelled = await _tokenRepository.CancelAndShiftQueueAsync(tokenId, userId, isAdmin);
        if (!cancelled)
            return CancellationResult.NotCancellable;

        var refreshedToken = await _tokenRepository.GetByIdAsync(tokenId) ?? token;
        var centerTokens = await _tokenRepository.GetByCenterAndDateAsync(refreshedToken.CenterId, refreshedToken.IssuedDate);
        var waitingTokens = centerTokens
            .Where(t => string.Equals(t.Status, "Waiting", StringComparison.OrdinalIgnoreCase))
            .OrderBy(t => t.QueuePosition ?? int.MaxValue)
            .ThenBy(t => t.IssuedTime)
            .ToList();

        var cancelledEvent = new QueueTokenCancelledEvent
        {
            TokenId = refreshedToken.TokenId,
            TokenNumber = refreshedToken.TokenNumber,
            CounterId = 0,
            CenterId = refreshedToken.CenterId,
            CancelledAt = refreshedToken.CancelledAt ?? DateTime.UtcNow,
            CancelledBy = isAdmin ? "admin" : "citizen",
            NextWaitingTokenNumber = waitingTokens.FirstOrDefault()?.TokenNumber,
            NewWaitingCount = waitingTokens.Count
        };

        try
        {
            await _eventBus.PublishAsync(cancelledEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Token cancellation succeeded but event bus publish failed for token {TokenId}",
                cancelledEvent.TokenId);
        }

        try
        {
            await _queueBroadcastService.BroadcastTokenCancelled(cancelledEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Token cancellation succeeded but SignalR broadcast failed for token {TokenId}",
                cancelledEvent.TokenId);
        }

        return CancellationResult.Success;
    }
}
