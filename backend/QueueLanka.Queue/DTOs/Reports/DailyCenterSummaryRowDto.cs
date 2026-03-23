// backend/QueueLanka.Queue/DTOs/Reports/DailyCenterSummaryRowDto.cs

namespace QueueLanka.Queue.DTOs.Reports;

public class DailyCenterSummaryRowDto
{
    public DateOnly Date { get; set; }
    public int CenterId { get; set; }
    public string CenterName { get; set; } = string.Empty;
    public int TotalTokensIssued { get; set; }
    public int TotalServed { get; set; }
    public int TotalSkipped { get; set; }
    public int TotalCancelled { get; set; }
    public int NoShowCount { get; set; }
    public int AverageWaitTimeSeconds { get; set; }
    public int AverageServiceTimeSeconds { get; set; }
    public int PeakHour { get; set; }
    public int PeakHourTokenCount { get; set; }
    public int ActiveCounters { get; set; }
}
