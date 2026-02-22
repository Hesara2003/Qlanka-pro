namespace QueueLanka.API.Services;

public interface IEmailService
{
    /// <summary>Send an email verification message to the user.</summary>
    Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl);
}
