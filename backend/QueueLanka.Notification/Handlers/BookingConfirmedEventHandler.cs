using Microsoft.Extensions.Logging;
using QueueLanka.Shared.Events;
using QueueLanka.Notification.Services;

namespace QueueLanka.Notification.Handlers;

public class BookingConfirmedEventHandler : IIntegrationEventHandler<BookingConfirmedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<BookingConfirmedEventHandler> _logger;

    public BookingConfirmedEventHandler(INotificationService notificationService, ILogger<BookingConfirmedEventHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task HandleAsync(BookingConfirmedEvent @event)
    {
        _logger.LogInformation("Handling BookingConfirmedEvent for Token {TokenNumber}", @event.TokenNumber);
        
        await _notificationService.SendBookingConfirmationAsync(
            @event.UserName,
            @event.UserEmail,
            @event.CenterName,
            @event.AppointmentDate,
            @event.AppointmentTime,
            @event.TokenNumber
        );
    }
}
