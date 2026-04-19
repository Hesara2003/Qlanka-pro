namespace QueueLanka.Queue.DTOs.Reports;

public class CustomReportPreviewDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public IReadOnlyList<string> Headers { get; set; } = Array.Empty<string>();
    public IReadOnlyList<IReadOnlyList<string>> Rows { get; set; } = Array.Empty<IReadOnlyList<string>>();
    public IReadOnlyList<string>? TotalRow { get; set; }
}
