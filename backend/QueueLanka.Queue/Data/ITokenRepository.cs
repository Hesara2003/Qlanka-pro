using QueueLanka.Queue.Models;

namespace QueueLanka.Queue.Data;

public interface ITokenRepository
{
    Task<Token> CreateAsync(Token token);
    Task<Token?> GetByIdAsync(int tokenId);
    Task<Token?> GetByNumberDateCenterAsync(int centerId, DateTime date, string tokenNumber);
    Task<IEnumerable<Token>> GetByUserIdAsync(int userId);
    Task<IEnumerable<Token>> GetByCenterAndDateAsync(int centerId, DateTime date);
    Task<int> CountByCenterAndDateAsync(int centerId, DateTime date);
    Task<bool> UpdateStatusAsync(int tokenId, string status);
    Task<bool> CancelUserTokenAsync(int tokenId, int userId);
    /// <summary>
    /// Cancels a Waiting token owned by <paramref name="userId"/> and atomically
    /// shifts all subsequent Waiting tokens in the same queue one position forward.
    /// </summary>
    /// <param name="isAdmin">If true, bypasses the user_id ownership check.</param>
    Task<bool> CancelAndShiftQueueAsync(int tokenId, int userId, bool isAdmin = false);
}
