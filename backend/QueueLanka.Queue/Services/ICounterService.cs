// backend/QueueLanka.Queue/Services/ICounterService.cs

using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.DTOs.Counter;

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

    /// <summary>
    /// Reassigns a token from the source counter to a target counter, updates queue positions,
    /// emits reassignment events, and records audit information.
    /// </summary>
    Task<ReassignTokenResponseDto> ReassignTokenAsync(
        int sourceCounterId,
        int tokenId,
        int targetCounterId,
        string? reason,
        int performedByUserId);

    /// <summary>
    /// Returns full dashboard details for the specified counter.
    /// Validates officer assignment when officerUserId is provided.
    /// </summary>
    Task<CounterDashboardDto> GetDashboardAsync(int counterId, int officerUserId);

    /// <summary>
    /// Returns waiting token list for the specified counter.
    /// Validates officer assignment when officerUserId is provided.
    /// </summary>
    Task<IReadOnlyList<WaitingTokenDto>> GetWaitingTokensAsync(int counterId, int officerUserId);

    Task<CounterResponseDto> CreateCounterAsync(CreateCounterRequestDto request, int adminUserId);
    Task<ListCountersResponseDto> GetCountersByCenterAsync(int centerId, int adminUserId);
    Task<CounterResponseDto> GetCounterByIdAsync(int centerId, int counterId, int adminUserId);
    Task<CounterResponseDto> UpdateCounterStatusAsync(int centerId, int counterId, UpdateCounterStatusRequestDto request, int adminUserId);
}
