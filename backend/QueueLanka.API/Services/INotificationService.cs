using QueueLanka.API.Models;

namespace QueueLanka.API.Services;

public interface INotificationService
{
    /// <summary>
    /// Dispatches booking confirmation notifications across all configured channels (Email, SMS, etc).
    /// </summary>
    Task SendBookingConfirmationAsync(User user, ServiceCenter center, Appointment appointment, Token token);
}
