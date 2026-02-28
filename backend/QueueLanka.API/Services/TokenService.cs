using QueueLanka.API.Data;
using QueueLanka.API.DTOs.Token;

namespace QueueLanka.API.Services;

public class TokenService : ITokenService
{
    private readonly ITokenRepository _tokenRepository;
    private readonly IServiceCenterRepository _serviceCenterRepository;

    public TokenService(ITokenRepository tokenRepository, IServiceCenterRepository serviceCenterRepository)
    {
        _tokenRepository = tokenRepository;
        _serviceCenterRepository = serviceCenterRepository;
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
                    
                    var totalMinutes = (closingTime - openingTime).TotalMinutes;
                    if (totalMinutes > 0 && center.Capacity > 0)
                    {
                        var avgServiceTime = totalMinutes / center.Capacity;
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
}
