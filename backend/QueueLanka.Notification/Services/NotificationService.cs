using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace QueueLanka.Notification.Services;

public class NotificationService : INotificationService
{
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IEmailService emailService, ILogger<NotificationService> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task SendVerificationEmailAsync(string firstName, string email, string token)
    {
        try
        {
            var subject = "Verify your QueueLanka Pro email";
            var body = $@"
                <h2>Welcome to QueueLanka Pro, {firstName}!</h2>
                <p>Please verify your email address using the token below:</p>
                <h3 style='background-color: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 2px;'>{token}</h3>
                <p>This token will expire in 24 hours.</p>
                <p>If you did not request this, please ignore this email.</p>";

            await _emailService.SendEmailAsync(email, subject, body);
            _logger.LogInformation("Verification email sent to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", email);
            throw; // Optional: rethrow if missing email is critical, or just log
        }
    }

    public async Task SendBookingConfirmationAsync(string userName, string userEmail, string centerName, DateTime appointmentDate, TimeSpan appointmentTime, string tokenNumber)
    {
        try
        {
            var subject = $"Booking Confirmed: {tokenNumber} - QueueLanka Pro";
            var body = $@"
                <h2>Hello {userName},</h2>
                <p>Your appointment has been successfully booked!</p>
                <h3>Booking Details:</h3>
                <ul>
                    <li><strong>Service Center:</strong> {centerName}</li>
                    <li><strong>Date:</strong> {appointmentDate:MMMM dd, yyyy}</li>
                    <li><strong>Time:</strong> {appointmentTime:hh\:mm tt}</li>
                    <li><strong>Token Number:</strong> <span style='font-size: 1.2em; font-weight: bold;'>{tokenNumber}</span></li>
                </ul>
                <p>Please arrive at the center at least 10 minutes before your scheduled time.</p>
                <p>Thank you for using QueueLanka Pro!</p>";

            await _emailService.SendEmailAsync(userEmail, subject, body);
            _logger.LogInformation("Booking confirmation sent to {Email} for token {Token}", userEmail, tokenNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send booking confirmation to {Email}", userEmail);
            // Non-critical: Swallow exception so booking succeeds even if email fails
        }
    }

    public async Task SendCancellationNoticeAsync(string userName, string userEmail, string centerName, string tokenNumber)
    {
        try
        {
            var subject = $"Token {tokenNumber} Cancelled - QueueLanka Pro";
            var body = $@"
                <h2>Hello {userName},</h2>
                <p>Your token <strong>{tokenNumber}</strong> for {centerName} has been cancelled.</p>
                <p>If you believe this was a mistake, please book a new appointment.</p>";

            await _emailService.SendEmailAsync(userEmail, subject, body);
            _logger.LogInformation("Cancellation notice sent to {Email} for token {Token}", userEmail, tokenNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send cancellation notice to {Email}", userEmail);
        }
    }
}
