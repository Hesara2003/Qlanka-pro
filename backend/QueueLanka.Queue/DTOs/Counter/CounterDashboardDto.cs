// backend/QueueLanka.Queue/DTOs/Counter/CounterDashboardDto.cs

namespace QueueLanka.Queue.DTOs.Counter;

public class CounterDashboardDto
{
    public int CounterId { get; set; }
    public string CounterName { get; set; } = string.Empty;
    public bool IsOpen { get; set; }
    public CurrentTokenDto? CurrentToken { get; set; }
    public List<WaitingTokenDto> WaitingTokens { get; set; } = new();
    public int ServedCount { get; set; }
    public int SkippedCount { get; set; }
    public int AverageServiceTimeSeconds { get; set; }
}
