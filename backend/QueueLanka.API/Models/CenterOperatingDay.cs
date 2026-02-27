namespace QueueLanka.API.Models;

public class CenterOperatingDay
{
    public int OperatingDayId { get; set; }
    public int CenterId { get; set; }
    public string DayOfWeek { get; set; } = string.Empty;
    public bool IsOpen { get; set; }
    public TimeSpan? OpeningTime { get; set; }
    public TimeSpan? ClosingTime { get; set; }
    public DateTime CreatedAt { get; set; }
}
