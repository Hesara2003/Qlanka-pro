namespace QueueLanka.API.Services;

public interface IEmailVerificationService
{
    /// <summary>
    /// Generates a secure token, persists it, and emails a verification link to the user.
    /// </summary>
    Task SendVerificationAsync(int userId, string email, string username);

    /// <summary>
    /// Validates the token, marks it used, and activates the user's email flag.
    /// Throws <see cref="Exceptions.InvalidVerificationTokenException"/> on failure.
    /// </summary>
    Task VerifyAsync(string token);
}
