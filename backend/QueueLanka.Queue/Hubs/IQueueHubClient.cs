// backend/QueueLanka.Queue/Hubs/IQueueHubClient.cs

using QueueLanka.Queue.Events;

namespace QueueLanka.Queue.Hubs;

public interface IQueueHubClient
{
    Task TokenCalled(TokenCalledEvent calledToken);
    Task TokenStatusUpdated(TokenStatusUpdatedEvent payload);
    Task TokenReassigned(TokenReassignedEvent payload);
}
