// backend/QueueLanka.Queue/Data/ICounterRepository.cs

using QueueLanka.Queue.Models;

namespace QueueLanka.Queue.Data;

public interface ICounterRepository
{
    /// <summary>
    /// Atomically fetches the earliest waiting token for the given counter,
    /// updates its status to 'Called', sets called_at to UTC now, and returns
    /// the updated token.  Returns null if no waiting token exists.
    /// Uses SELECT … FOR UPDATE inside a transaction to prevent two concurrent
    /// officers from claiming the same token.
    /// </summary>
    Task<Token?> CallNextTokenAsync(int counterId);

    /// <summary>
    /// Returns true if the counter exists and its current status is 'Open'.
    /// </summary>
    Task<bool> IsCounterOpenAsync(int counterId);

    /// <summary>
    /// Atomically updates a called token to served/skipped, clears the current token on the
    /// specified counter, then advances the counter to the next waiting token if one exists.
    /// Throws when token is missing, not owned by the counter, or not in called state.
    /// </summary>
    Task<(Token Token, int CounterId, int? NextTokenId)> UpdateTokenStatusAsync(int counterId, int tokenId, string status);
}
