using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public interface IPasswordResetRepository
{
    /// <summary>Persist a new reset token and return its TokenId.</summary>
    Task<int> CreateAsync(PasswordResetToken token);

    /// <summary>Find an unused, non-expired token by value. Returns null if none found.</summary>
    Task<PasswordResetToken?> GetValidByTokenAsync(string token);

    /// <summary>Mark a token as used (sets used_at = UTC now).</summary>
    Task MarkUsedAsync(int tokenId);

    /// <summary>Invalidate all unused reset tokens for a user (e.g. after a successful reset).</summary>
    Task InvalidateAllForUserAsync(int userId);
}
