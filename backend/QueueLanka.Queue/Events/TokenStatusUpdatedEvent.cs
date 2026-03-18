// backend/QueueLanka.Queue/Events/TokenStatusUpdatedEvent.cs

namespace QueueLanka.Queue.Events;

public class TokenStatusUpdatedEvent
{
    public int TokenId { get; set; }
    public int CenterId { get; set; }
    public int CounterId { get; set; }
    public int? UserId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public DateTime IssuedTime { get; set; }
    public DateTime? CalledAt { get; set; }
    public DateTime? ServedAt { get; set; }
    public string Status { get; set; } = string.Empty;
}