using QueueLanka.Queue.DTOs.Token;

namespace QueueLanka.Queue.Services;

public interface ITokenService
{
    Task<IEnumerable<UserTokenResponseDto>> GetUserTokensAsync(int userId);

    /// <summary>
    /// Attempts to cancel the token identified by <paramref name="tokenId"/> on behalf
    /// of <paramref name="userId"/>, or unconditionally if <paramref name="isAdmin"/> is true.
    /// Returns a <see cref="CancellationResult"/> that describes the exact outcome so callers can surface specific feedback.
    /// </summary>
    Task<CancellationResult> CancelTokenAsync(int tokenId, int userId, bool isAdmin = false);
}
