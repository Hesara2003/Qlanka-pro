// backend/QueueLanka.Queue/Hubs/QueueHub.cs

using Microsoft.AspNetCore.SignalR;
using QueueLanka.Queue.Events;

namespace QueueLanka.Queue.Hubs;

public class QueueHub : Hub<IQueueHubClient>
{
    private const string JoinedGroupsContextKey = "QueueHub.JoinedGroups";
    private readonly ILogger<QueueHub> _logger;

    public QueueHub(ILogger<QueueHub> logger)
    {
        _logger = logger;
    }

    public static string GetCenterGroupName(int centerId) => $"queue-{centerId}";
    public static string GetCounterGroupName(int counterId) => $"counter-{counterId}";

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("SignalR connected: {ConnectionId}", Context.ConnectionId);

        var centerIdQuery = Context.GetHttpContext()?.Request.Query["centerId"].ToString();
        if (int.TryParse(centerIdQuery, out var centerId) && centerId > 0)
        {
            var groupName = GetCenterGroupName(centerId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            TrackJoinedGroup(groupName);

            _logger.LogInformation(
                "SignalR connection {ConnectionId} auto-joined group {GroupName}",
                Context.ConnectionId,
                groupName);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (Context.Items.TryGetValue(JoinedGroupsContextKey, out var value)
            && value is HashSet<string> groups)
        {
            foreach (var group in groups)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
            }
        }

        _logger.LogInformation(
            exception == null
                ? "SignalR disconnected: {ConnectionId}"
                : "SignalR disconnected with error: {ConnectionId}",
            Context.ConnectionId);

        await base.OnDisconnectedAsync(exception);
    }

    public Task JoinCenterGroup(int centerId)
    {
        var groupName = GetCenterGroupName(centerId);
        TrackJoinedGroup(groupName);
        return Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public Task LeaveCenterGroup(int centerId)
    {
        var groupName = GetCenterGroupName(centerId);
        UntrackJoinedGroup(groupName);
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    public Task JoinCounterGroup(int counterId)
    {
        var groupName = GetCounterGroupName(counterId);
        TrackJoinedGroup(groupName);
        return Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public Task LeaveCounterGroup(int counterId)
    {
        var groupName = GetCounterGroupName(counterId);
        UntrackJoinedGroup(groupName);
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
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

    public Task BroadcastTokenCancelled(TokenCancelledEvent payload)
    {
        return Clients.Group(GetCenterGroupName(payload.CenterId)).TokenCancelled(payload);
    }

    public Task BroadcastQueueUpdated(QueueUpdatedEvent payload)
    {
        return Clients.Group(GetCounterGroupName(payload.CounterId)).QueueUpdated(payload);
    }

    public Task BroadcastCounterStatusChanged(CounterStatusEvent payload)
    {
        return Clients.Group(GetCenterGroupName(payload.CenterId)).CounterStatusChanged(payload);
    }

    public static Task BroadcastTokenCancelled(
        IHubContext<QueueHub, IQueueHubClient> hubContext,
        TokenCancelledEvent payload)
    {
        return hubContext.Clients
            .Group(GetCenterGroupName(payload.CenterId))
            .TokenCancelled(payload);
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

    private void TrackJoinedGroup(string groupName)
    {
        if (!Context.Items.TryGetValue(JoinedGroupsContextKey, out var value)
            || value is not HashSet<string> groups)
        {
            groups = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            Context.Items[JoinedGroupsContextKey] = groups;
        }

        groups.Add(groupName);
    }

    private void UntrackJoinedGroup(string groupName)
    {
        if (Context.Items.TryGetValue(JoinedGroupsContextKey, out var value)
            && value is HashSet<string> groups)
        {
            groups.Remove(groupName);
        }
    }
}
