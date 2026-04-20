namespace QueueLanka.Queue.DTOs.Reports;

public class CustomReportRowDto
{
    public DateOnly? Date { get; set; }
    public int? CenterId { get; set; }
    public string? CenterName { get; set; }
    public Dictionary<string, double> Metrics { get; set; } = new();
}
