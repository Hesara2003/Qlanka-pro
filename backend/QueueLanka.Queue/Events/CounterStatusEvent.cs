// backend/QueueLanka.Queue/Events/CounterStatusEvent.cs

namespace QueueLanka.Queue.Events;

public class CounterStatusEvent
{
    public int CounterId { get; set; }
    public int CenterId { get; set; }
    public bool IsOpen { get; set; }
    public string CounterName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}
