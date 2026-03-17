using QueueLanka.Identity.Models;

namespace QueueLanka.Identity.Data;

public interface IEmailVerificationRepository
{
    /// <summary>Persist a new verification token and return its TokenId.</summary>
    Task<int> CreateAsync(EmailVerificationToken token);

    /// <summary>Find an unused, non-expired token by its value. Returns null if none found.</summary>
    Task<EmailVerificationToken?> GetValidByTokenAsync(string token);

    /// <summary>Mark a token as used (set used_at = UTC now).</summary>
    Task MarkUsedAsync(int tokenId);
}
