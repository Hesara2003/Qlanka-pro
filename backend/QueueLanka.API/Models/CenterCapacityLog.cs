namespace QueueLanka.API.Models;

public class CenterCapacityLog
{
    public int LogId { get; set; }
    public int CenterId { get; set; }
    public int CurrentCapacity { get; set; }
    public int QueueLength { get; set; }
    public int MaxCapacity { get; set; }
    public DateTime Timestamp { get; set; }
}
