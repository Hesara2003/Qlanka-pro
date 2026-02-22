namespace QueueLanka.API.Services;

public interface IPasswordResetService
{
    /// <summary>
    /// If the email belongs to a registered user, generates a secure reset token,
    /// persists it, and emails a reset link. Always returns without revealing whether
    /// the email exists (prevents user enumeration).
    /// </summary>
    Task InitiateResetAsync(string email);

    /// <summary>
    /// Validates the token, hashes the new password, updates the user record,
    /// and invalidates all remaining reset tokens for that user.
    /// Throws <see cref="Exceptions.InvalidPasswordResetTokenException"/> on failure.
    /// </summary>
    Task ResetPasswordAsync(string token, string newPassword);
}
