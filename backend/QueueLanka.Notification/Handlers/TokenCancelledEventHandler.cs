using Microsoft.Extensions.Logging;
using QueueLanka.Shared.Events;
using QueueLanka.Notification.Services;

namespace QueueLanka.Notification.Handlers;

public class TokenCancelledEventHandler : IIntegrationEventHandler<TokenCancelledEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<TokenCancelledEventHandler> _logger;

    public TokenCancelledEventHandler(INotificationService notificationService, ILogger<TokenCancelledEventHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task HandleAsync(TokenCancelledEvent @event)
    {
        _logger.LogInformation("Handling TokenCancelledEvent for Token {TokenNumber}", @event.TokenNumber);
        
        await _notificationService.SendCancellationNoticeAsync(
            @event.UserName,
            @event.UserEmail,
            @event.CenterName,
            @event.TokenNumber
        );
    }
}
