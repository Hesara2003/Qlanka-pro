using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

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
}
