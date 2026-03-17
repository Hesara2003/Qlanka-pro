using System;
using System.Threading.Tasks;

namespace QueueLanka.Notification.Services;

public interface INotificationService
{
    Task SendVerificationEmailAsync(string firstName, string email, string token);
    Task SendBookingConfirmationAsync(string userName, string userEmail, string centerName, DateTime appointmentDate, TimeSpan appointmentTime, string tokenNumber);
    Task SendCancellationNoticeAsync(string userName, string userEmail, string centerName, string tokenNumber);
}
