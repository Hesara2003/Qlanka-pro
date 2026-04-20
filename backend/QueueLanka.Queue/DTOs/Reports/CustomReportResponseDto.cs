namespace QueueLanka.Queue.DTOs.Reports;

public class CustomReportResponseDto
{
    public string GroupBy { get; set; } = "date_center";
    public List<string> Metrics { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalGroups { get; set; }
    public List<CustomReportRowDto> Rows { get; set; } = new();
}
