// backend/QueueLanka.Queue/Hubs/QueueHub.cs

using Microsoft.AspNetCore.SignalR;
using QueueLanka.Queue.Events;

namespace QueueLanka.Queue.Hubs;

public class QueueHub : Hub<IQueueHubClient>
{
    public static string GetCenterGroupName(int centerId) => $"queue-{centerId}";

    public Task JoinCenterGroup(int centerId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, GetCenterGroupName(centerId));
    }

    public Task LeaveCenterGroup(int centerId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, GetCenterGroupName(centerId));
    }

    public Task BroadcastTokenCalled(TokenCalledEvent calledToken)
    {
        return Clients.Group(GetCenterGroupName(calledToken.CenterId)).TokenCalled(calledToken);
    }
}
