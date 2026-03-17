namespace QueueLanka.ServiceCenter.Models;

public class ServiceCenter
{
    // ── Navigation property ──────────────────────────────────────
    /// <summary>
    /// Structured location detail. Null when not loaded or not yet recorded.
    /// Populated by <c>ServiceCenterRepository.GetByIdAsync</c> and
    /// <c>GetAllAsync</c> via the <c>v_center_with_location</c> view.
    /// </summary>
    public CenterLocation? Location { get; set; }

    public int CenterId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Description { get; set; }
    public string Timezone { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int AverageServiceTimeMinutes { get; set; } = 15;
    public TimeSpan OpeningTime { get; set; }
    public TimeSpan ClosingTime { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
