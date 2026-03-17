namespace QueueLanka.Queue.Integration;

public class ServiceCenterDto
{
    public int CenterId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int Capacity { get; set; }
    public TimeSpan OpeningTime { get; set; }
    public TimeSpan ClosingTime { get; set; }
    public int AverageServiceTimeMinutes { get; set; }
}

public class CenterAvailabilityDto
{
    public bool IsAvailable { get; set; }
    public TimeSpan? OpeningTime { get; set; }
    public TimeSpan? ClosingTime { get; set; }
    public string? Reason { get; set; }
}

public class CenterOperatingDayDto
{
    public string DayOfWeek { get; set; } = string.Empty;
    public bool IsOpen { get; set; }
    public TimeSpan? OpeningTime { get; set; }
    public TimeSpan? ClosingTime { get; set; }
}

public interface IServiceCenterClient
{
    Task<ServiceCenterDto?> GetCenterAsync(int centerId);
    Task<CenterAvailabilityDto?> GetAvailabilityAsync(int centerId, DateTime date);
    Task<IEnumerable<CenterOperatingDayDto>> GetOperatingDaysAsync(int centerId);
}
