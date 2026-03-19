// backend/QueueLanka.Queue/Events/TokenStatusUpdatedEvent.cs

namespace QueueLanka.Queue.Events;

public class TokenStatusUpdatedEvent
{
    public int TokenId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public int CounterId { get; set; }
    public int CenterId { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public DateTime? ServedAt { get; set; }
    public DateTime? SkippedAt { get; set; }
    public string? NextWaitingTokenNumber { get; set; }
}