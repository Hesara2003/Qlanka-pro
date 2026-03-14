namespace QueueLanka.API.Models;

public class CenterAvailability
{
    public int AvailabilityId { get; set; }
    public int CenterId { get; set; }
    public DateTime Date { get; set; }
    public bool IsAvailable { get; set; }
    public TimeSpan? OpeningTime { get; set; }
    public TimeSpan? ClosingTime { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
