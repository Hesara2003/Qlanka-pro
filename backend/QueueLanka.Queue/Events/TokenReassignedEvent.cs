// backend/QueueLanka.Queue/Events/TokenReassignedEvent.cs

namespace QueueLanka.Queue.Events;

public class TokenReassignedEvent
{
    public int TokenId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public int CenterId { get; set; }
    public int SourceCounterId { get; set; }
    public int TargetCounterId { get; set; }
    public DateTime ReassignedAt { get; set; }
    public string? Reason { get; set; }
}