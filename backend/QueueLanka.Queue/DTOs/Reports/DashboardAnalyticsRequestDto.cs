// backend/QueueLanka.Queue/DTOs/Reports/DashboardAnalyticsRequestDto.cs

using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.DTOs.Reports;

[DateRange(nameof(FromDate), nameof(ToDate), 90)]
public class DashboardAnalyticsRequestDto
{
    [Required(ErrorMessage = "FromDate is required.")]
    public DateTime FromDate { get; set; }

    [Required(ErrorMessage = "ToDate is required.")]
    public DateTime ToDate { get; set; }

    public List<int> CenterIds { get; set; } = new();
}