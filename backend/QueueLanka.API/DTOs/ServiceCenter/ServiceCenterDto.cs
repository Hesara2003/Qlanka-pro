namespace QueueLanka.API.DTOs.ServiceCenter;

public class ServiceCenterDto
{
    public int CenterId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Description { get; set; }
    public string Timezone { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string OpeningTime { get; set; } = string.Empty;
    public string ClosingTime { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
