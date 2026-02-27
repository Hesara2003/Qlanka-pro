namespace QueueLanka.API.Services;

public interface IEmailService
{
    /// <summary>Send an email verification message to the user.</summary>
    Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl);
    
    /// <summary>Send a token booking confirmation email.</summary>
    Task SendBookingEmailAsync(string toEmail, string toName, string centerName, string date, string time, string tokenNumber);
}
