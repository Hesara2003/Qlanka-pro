using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.Integration;

namespace QueueLanka.Queue.Services;

public class TokenService : ITokenService
{
    private readonly ITokenRepository _tokenRepository;
    private readonly IServiceCenterClient _serviceCenterClient;

    public TokenService(ITokenRepository tokenRepository, IServiceCenterClient serviceCenterClient)
    {
        _tokenRepository = tokenRepository;
        _serviceCenterClient = serviceCenterClient;
    }

    public async Task<IEnumerable<UserTokenResponseDto>> GetUserTokensAsync(int userId)
    {
        var tokens = await _tokenRepository.GetByUserIdAsync(userId);
        var responseTokens = new List<UserTokenResponseDto>();

        foreach (var token in tokens)
        {
            var center = await _serviceCenterRepository.GetByIdAsync(token.CenterId);
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
                    var availability = await _serviceCenterRepository.GetAvailabilityForDateAsync(token.CenterId, token.IssuedDate);
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
        return cancelled ? CancellationResult.Success : CancellationResult.NotCancellable;
    }
}
