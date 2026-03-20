// backend/QueueLanka.Queue/Services/QueueBroadcastService.cs

using Microsoft.AspNetCore.SignalR;
using QueueLanka.Queue.Events;
using QueueLanka.Queue.Hubs;

namespace QueueLanka.Queue.Services;

public interface IQueueBroadcastService
{
    Task BroadcastTokenCalled(TokenCalledEvent payload);
    Task BroadcastTokenServed(TokenStatusUpdatedEvent payload);
    Task BroadcastTokenSkipped(TokenStatusUpdatedEvent payload);
    Task BroadcastTokenCancelled(TokenCancelledEvent payload);
    Task BroadcastQueueUpdated(QueueUpdatedEvent payload);
    Task BroadcastTokenReassigned(TokenReassignedEvent payload);
    Task BroadcastCounterStatusChanged(CounterStatusEvent payload);
}

public class QueueBroadcastService : IQueueBroadcastService
{
    private readonly IHubContext<QueueHub, IQueueHubClient> _hubContext;
    private readonly ILogger<QueueBroadcastService> _logger;

    public QueueBroadcastService(
        IHubContext<QueueHub, IQueueHubClient> hubContext,
        ILogger<QueueBroadcastService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public Task BroadcastTokenCalled(TokenCalledEvent payload)
    {
        var groupName = QueueHub.GetCenterGroupName(payload.CenterId);
        return BroadcastSafely(
            "TokenCalled",
            groupName,
            payload.TokenId,
            () => _hubContext.Clients.Group(groupName).TokenCalled(payload));
    }

    public Task BroadcastTokenServed(TokenStatusUpdatedEvent payload)
    {
        var groupName = QueueHub.GetCenterGroupName(payload.CenterId);
        return BroadcastSafely(
            "TokenServed",
            groupName,
            payload.TokenId,
            () => _hubContext.Clients.Group(groupName).TokenStatusUpdated(payload));
    }

    public Task BroadcastTokenSkipped(TokenStatusUpdatedEvent payload)
    {
        var groupName = QueueHub.GetCenterGroupName(payload.CenterId);
        return BroadcastSafely(
            "TokenSkipped",
            groupName,
            payload.TokenId,
            () => _hubContext.Clients.Group(groupName).TokenStatusUpdated(payload));
    }

    public Task BroadcastTokenCancelled(TokenCancelledEvent payload)
    {
        var groupName = QueueHub.GetCenterGroupName(payload.CenterId);
        return BroadcastSafely(
            "TokenCancelled",
            groupName,
            payload.TokenId,
            () => _hubContext.Clients.Group(groupName).TokenCancelled(payload));
    }

    public Task BroadcastQueueUpdated(QueueUpdatedEvent payload)
    {
        var groupName = QueueHub.GetCounterGroupName(payload.CounterId);
        return BroadcastSafely(
            "QueueUpdated",
            groupName,
            payload.CounterId,
            () => _hubContext.Clients.Group(groupName).QueueUpdated(payload));
    }

    public Task BroadcastTokenReassigned(TokenReassignedEvent payload)
    {
        var groupName = QueueHub.GetCenterGroupName(payload.CenterId);
        return BroadcastSafely(
            "TokenReassigned",
            groupName,
            payload.TokenId,
            () => _hubContext.Clients.Group(groupName).TokenReassigned(payload));
    }

    public Task BroadcastCounterStatusChanged(CounterStatusEvent payload)
    {
        var groupName = QueueHub.GetCenterGroupName(payload.CenterId);
        return BroadcastSafely(
            "CounterStatusChanged",
            groupName,
            payload.CounterId,
            () => _hubContext.Clients.Group(groupName).CounterStatusChanged(payload));
    }

    private async Task BroadcastSafely(string eventType, string groupName, int entityId, Func<Task> sendAsync)
    {
        try
        {
            await sendAsync();
            _logger.LogInformation(
                "Broadcast success. EventType={EventType} Group={GroupName} EntityId={EntityId}",
                eventType,
                groupName,
                entityId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Broadcast failed. EventType={EventType} Group={GroupName} EntityId={EntityId}",
                eventType,
                groupName,
                entityId);
        }
    }
}