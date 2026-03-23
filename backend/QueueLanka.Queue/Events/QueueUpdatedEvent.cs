// backend/QueueLanka.Queue/Events/QueueUpdatedEvent.cs

using QueueLanka.Queue.DTOs.Counter;

namespace QueueLanka.Queue.Events;

public class QueueUpdatedEvent
{
    public int CounterId { get; set; }
    public int CenterId { get; set; }
    public List<WaitingTokenDto> WaitingTokens { get; set; } = new();
    public int WaitingCount { get; set; }
    public int ServedCountToday { get; set; }
    public int SkippedCountToday { get; set; }
    public DateTime Timestamp { get; set; }
    public string TriggerAction { get; set; } = string.Empty;
}
