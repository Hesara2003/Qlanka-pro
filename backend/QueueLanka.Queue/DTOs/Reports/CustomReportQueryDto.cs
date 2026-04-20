using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.DTOs.Reports;

public class CustomReportQueryDto
{
    [Required(ErrorMessage = "FromDate is required.")]
    public DateTime FromDate { get; set; }

    [Required(ErrorMessage = "ToDate is required.")]
    public DateTime ToDate { get; set; }

    public List<int> CenterIds { get; set; } = new();

    public List<string> Statuses { get; set; } = new();

    public List<string> Metrics { get; set; } = new();

    public string GroupBy { get; set; } = "date_center";

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 100;
}
