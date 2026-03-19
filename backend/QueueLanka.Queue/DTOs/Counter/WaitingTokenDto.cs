// backend/QueueLanka.Queue/DTOs/Counter/WaitingTokenDto.cs

namespace QueueLanka.Queue.DTOs.Counter;

public class WaitingTokenDto
{
    public int TokenId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public int QueuePosition { get; set; }
    public DateTime IssuedAt { get; set; }
    public int EstimatedWaitSeconds { get; set; }
}
