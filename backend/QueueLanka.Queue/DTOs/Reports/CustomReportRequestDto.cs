using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.DTOs.Reports;

[DateRange(nameof(FromDate), nameof(ToDate), 90)]
public class CustomReportRequestDto
{
    [Required(ErrorMessage = "FromDate is required.")]
    public DateTime FromDate { get; set; }

    [Required(ErrorMessage = "ToDate is required.")]
    public DateTime ToDate { get; set; }

    public List<int> CenterIds { get; set; } = new();

    public List<string> Statuses { get; set; } = new();

    [MinLength(1, ErrorMessage = "At least one metric must be selected.")]
    public List<string> Metrics { get; set; } = new();
}
