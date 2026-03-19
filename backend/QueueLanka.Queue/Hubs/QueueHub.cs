// backend/QueueLanka.Queue/Hubs/QueueHub.cs

using Microsoft.AspNetCore.SignalR;
using QueueLanka.Queue.Events;

namespace QueueLanka.Queue.Hubs;

public class QueueHub : Hub<IQueueHubClient>
{
    public static string GetCenterGroupName(int centerId) => $"queue-{centerId}";
    public static string GetCounterGroupName(int counterId) => $"counter-{counterId}";

    public Task JoinCenterGroup(int centerId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, GetCenterGroupName(centerId));
    }

    public Task LeaveCenterGroup(int centerId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, GetCenterGroupName(centerId));
    }

    public Task JoinCounterGroup(int counterId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, GetCounterGroupName(counterId));
    }

    public Task LeaveCounterGroup(int counterId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, GetCounterGroupName(counterId));
    }

    public Task BroadcastTokenCalled(TokenCalledEvent calledToken)
    {
        return Clients.Group(GetCenterGroupName(calledToken.CenterId)).TokenCalled(calledToken);
    }

    public Task BroadcastTokenStatusUpdated(TokenStatusUpdatedEvent payload)
    {
        return Clients.Group(GetCenterGroupName(payload.CenterId)).TokenStatusUpdated(payload);
    }

    public Task BroadcastTokenReassigned(TokenReassignedEvent payload)
    {
        return Clients.Group(GetCenterGroupName(payload.CenterId)).TokenReassigned(payload);
    }

    public Task BroadcastQueueUpdated(QueueUpdatedEvent payload)
    {
        return Clients.Group(GetCounterGroupName(payload.CounterId)).QueueUpdated(payload);
    }

    public Task BroadcastCounterStatusChanged(CounterStatusEvent payload)
    {
        return Clients.Group(GetCenterGroupName(payload.CenterId)).CounterStatusChanged(payload);
    }

    public static Task BroadcastTokenStatusUpdated(
        IHubContext<QueueHub, IQueueHubClient> hubContext,
        TokenStatusUpdatedEvent payload)
    {
        return hubContext.Clients
            .Group(GetCenterGroupName(payload.CenterId))
            .TokenStatusUpdated(payload);
    }

    public static Task BroadcastTokenReassigned(
        IHubContext<QueueHub, IQueueHubClient> hubContext,
        TokenReassignedEvent payload)
    {
        return hubContext.Clients
            .Group(GetCenterGroupName(payload.CenterId))
            .TokenReassigned(payload);
    }

    public static Task BroadcastQueueUpdated(
        IHubContext<QueueHub, IQueueHubClient> hubContext,
        QueueUpdatedEvent payload)
    {
        return hubContext.Clients
            .Group(GetCounterGroupName(payload.CounterId))
            .QueueUpdated(payload);
    }

    public static Task BroadcastCounterStatusChanged(
        IHubContext<QueueHub, IQueueHubClient> hubContext,
        CounterStatusEvent payload)
    {
        return hubContext.Clients
            .Group(GetCenterGroupName(payload.CenterId))
            .CounterStatusChanged(payload);
    }
}
