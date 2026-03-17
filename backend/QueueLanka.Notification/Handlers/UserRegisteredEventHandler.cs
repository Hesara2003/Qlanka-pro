using Microsoft.Extensions.Logging;
using QueueLanka.Shared.Events;
using QueueLanka.Notification.Services;

namespace QueueLanka.Notification.Handlers;

public class UserRegisteredEventHandler : IIntegrationEventHandler<UserRegisteredEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<UserRegisteredEventHandler> _logger;

    public UserRegisteredEventHandler(INotificationService notificationService, ILogger<UserRegisteredEventHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task HandleAsync(UserRegisteredEvent @event)
    {
        _logger.LogInformation("Handling UserRegisteredEvent for {Email}", @event.Email);
        
        // Using a dynamic/anonymous object or creating the expected parameters for the existing service method.
        // For MVP, we will directly call the INotificationService method if we refactor it, or just call email service.
        await _notificationService.SendVerificationEmailAsync(@event.FirstName, @event.Email, @event.VerificationToken);
    }
}
