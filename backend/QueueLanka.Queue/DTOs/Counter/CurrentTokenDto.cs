// backend/QueueLanka.Queue/DTOs/Counter/CurrentTokenDto.cs

namespace QueueLanka.Queue.DTOs.Counter;

public class CurrentTokenDto
{
    public int TokenId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? CalledAt { get; set; }
    public int WaitedSeconds { get; set; }
}
