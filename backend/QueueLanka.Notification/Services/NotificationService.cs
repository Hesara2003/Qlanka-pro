

namespace QueueLanka.Notification.Services;

/// <summary>
/// A centralized notification router. It accepts entity payloads and decides which delivery mechanisms
/// (Email, SMS, In-App) should be fired. Designed for Fire-And-Forget invocation.
/// </summary>
public class NotificationService : INotificationService
{
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IEmailService emailService, ILogger<NotificationService> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task SendBookingConfirmationAsync(User user, ServiceCenter center, Appointment appointment, Token token)
    {
        try
        {
            _logger.LogInformation("Dispatching Booking Confirmation notifications for Token {TokenNumber}", token.TokenNumber);

            // Channel 1: Email
            var dateString = appointment.AppointmentDate.ToString("MMMM dd, yyyy");
            var timeString = appointment.AppointmentTime.ToString(@"hh\:mm");
            
            await _emailService.SendBookingEmailAsync(
                toEmail: user.Email,
                toName: user.Username,
                centerName: center.Name,
                date: dateString,
                time: timeString,
                tokenNumber: token.TokenNumber
            );

            // Future expansion:
            // Channel 2: SMS
            // await _smsService.SendAsync(user.PhoneNumber, $"Your token at {center.Name} is {token.TokenNumber}");

            // Channel 3: In-App Push Notification
            // await _pushService.NotifyUser(user.UserId, "Booking Confirmed", $"Token {token.TokenNumber}");
        }
        catch (Exception ex)
        {
            // Do not bubble up exceptions! Notifications should not break the core booking pipeline.
            _logger.LogError(ex, "Failed to completely dispatch notifications for Token {TokenNumber}", token.TokenNumber);
        }
    }
}
