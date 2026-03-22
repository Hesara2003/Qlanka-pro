// backend/QueueLanka.Queue/DTOs/Counter/ListCountersResponseDto.cs

namespace QueueLanka.Queue.DTOs.Counter;

public class ListCountersResponseDto
{
    public List<CounterResponseDto> Counters { get; set; } = new();
    public int TotalCount { get; set; }
    public int CenterId { get; set; }
    public int OpenCount { get; set; }
    public int ClosedCount { get; set; }
}
