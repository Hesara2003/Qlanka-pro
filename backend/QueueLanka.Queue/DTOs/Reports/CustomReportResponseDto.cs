namespace QueueLanka.Queue.DTOs.Reports;

public class CustomReportResponseDto
{
    public CustomReportFiltersDto AppliedFilters { get; set; } = new();
    public List<string> SelectedMetrics { get; set; } = new();
    public Dictionary<string, decimal> AggregatedResults { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
}

public class CustomReportFiltersDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<int> CenterIds { get; set; } = new();
    public List<string> Statuses { get; set; } = new();
}

public class CustomReportAggregateDataDto
{
    public int TotalAppointments { get; set; }
    public int TotalQueuedUsers { get; set; }
    public int CompletedTokens { get; set; }
    public int CancelledAppointments { get; set; }
    public int TotalTokensIssued { get; set; }
    public int ServiceCount { get; set; }
    public decimal AverageWaitingTimeSeconds { get; set; }
    public decimal AverageServiceTimeSeconds { get; set; }
}
