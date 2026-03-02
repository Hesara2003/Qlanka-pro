using QueueLanka.API.DTOs.Token;

namespace QueueLanka.API.Services;

public interface ITokenService
{
    Task<IEnumerable<UserTokenResponseDto>> GetUserTokensAsync(int userId);
    Task<bool> CancelTokenAsync(int tokenId, int userId);
}
