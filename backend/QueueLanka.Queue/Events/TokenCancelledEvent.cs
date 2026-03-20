// backend/QueueLanka.Queue/Events/TokenCancelledEvent.cs

namespace QueueLanka.Queue.Events;

public class TokenCancelledEvent
{
    public int TokenId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public int CounterId { get; set; }
    public int CenterId { get; set; }
    public DateTime CancelledAt { get; set; }
    public string CancelledBy { get; set; } = string.Empty;
    public string? NextWaitingTokenNumber { get; set; }
    public int NewWaitingCount { get; set; }
}