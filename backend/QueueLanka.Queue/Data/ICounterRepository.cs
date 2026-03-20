// backend/QueueLanka.Queue/Data/ICounterRepository.cs

using QueueLanka.Queue.DTOs.Counter;
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

    /// <summary>
    /// Atomically reassigns a token from one counter to another and recomputes queue positions
    /// for both counters.
    /// Throws when source/target/token cannot be found, token ownership mismatches source,
    /// or target counter is not open.
    /// </summary>
    Task<(Token Token, int SourceCounterId, int TargetCounterId, DateTime ReassignedAt)> ReassignTokenAsync(
        int tokenId,
        int sourceCounterId,
        int targetCounterId);

    /// <summary>
    /// Fetches counter dashboard header data and current token by counter id.
    /// Returns null when counter does not exist.
    /// </summary>
    Task<(int CounterId, string CounterName, bool IsOpen, int? AssignedOfficerUserId, Token? CurrentToken)?>
        GetCounterDashboardAsync(int counterId);

    /// <summary>
    /// Returns all waiting tokens for the specified counter ordered FIFO.
    /// </summary>
    Task<IReadOnlyList<Token>> GetWaitingTokensAsync(int counterId);

    /// <summary>
    /// Returns count of tokens served today for the specified counter.
    /// </summary>
    Task<int> GetServedCountTodayAsync(int counterId);

    /// <summary>
    /// Returns count of tokens skipped today for the specified counter.
    /// </summary>
    Task<int> GetSkippedCountTodayAsync(int counterId);

    /// <summary>
    /// Returns average service time in seconds for served tokens today.
    /// </summary>
    Task<int> GetAverageServiceTimeAsync(int counterId);

    Task<CounterResponseDto> CreateCounterAsync(string name, int centerId, int? assignedOfficerUserId);
    Task<List<CounterResponseDto>> GetCountersByCenterAsync(int centerId);
    Task<CounterResponseDto?> GetCounterByIdAsync(int counterId);
    Task<CounterResponseDto?> UpdateCounterStatusAsync(int counterId, bool isOpen, string? reason);
    Task<bool> CounterExistsAsync(int counterId, int centerId);
    Task<bool> CounterNameExistsInCenterAsync(string name, int centerId);
    Task<bool> IsOfficerUserAsync(int userId);
    Task<(int WaitingCount, bool HasCalledToken)> GetCounterQueueStateAsync(int counterId);
}
