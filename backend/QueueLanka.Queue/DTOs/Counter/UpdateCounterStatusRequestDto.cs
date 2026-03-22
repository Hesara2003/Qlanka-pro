// backend/QueueLanka.Queue/DTOs/Counter/UpdateCounterStatusRequestDto.cs

namespace QueueLanka.Queue.DTOs.Counter;

public class UpdateCounterStatusRequestDto
{
    public bool IsOpen { get; set; }
    public string? Reason { get; set; }
}
