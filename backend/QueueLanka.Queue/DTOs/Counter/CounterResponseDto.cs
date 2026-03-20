// backend/QueueLanka.Queue/DTOs/Counter/CounterResponseDto.cs

namespace QueueLanka.Queue.DTOs.Counter;

public class CounterResponseDto
{
    public int CounterId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CenterId { get; set; }
    public string CenterName { get; set; } = string.Empty;
    public bool IsOpen { get; set; }
    public int? CurrentTokenNumber { get; set; }
    public int? AssignedOfficerUserId { get; set; }
    public string? AssignedOfficerName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? WarningMessage { get; set; }
}
