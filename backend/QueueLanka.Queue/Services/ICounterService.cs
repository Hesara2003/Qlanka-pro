// backend/QueueLanka.Queue/Services/ICounterService.cs

using QueueLanka.Queue.DTOs.Token;

namespace QueueLanka.Queue.Services;

public interface ICounterService
{
    /// <summary>
    /// Identifies the earliest waiting token for the given counter (FIFO),
    /// atomically marks it as 'Called', and returns its details.
    /// Returns null when no waiting token exists for today.
    /// Throws <see cref="InvalidOperationException"/> if the counter is closed.
    /// </summary>
    Task<CallNextTokenResponseDto?> CallNextTokenAsync(int counterId);

    /// <summary>
    /// Updates a called token to served or skipped, advances queue state for the counter,
    /// and returns the updated token details.
    /// </summary>
    Task<UpdateTokenStatusResponseDto> UpdateTokenStatusAsync(int counterId, int tokenId, string status);
}
