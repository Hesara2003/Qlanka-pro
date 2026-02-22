namespace QueueLanka.API.Services;

public interface IEmailService
{
    /// <summary>Send an email verification message to the user.</summary>
    Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl);

    /// <summary>Send a password reset email with a secure reset link.</summary>
    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetUrl);
}
