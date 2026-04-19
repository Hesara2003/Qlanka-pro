// backend/QueueLanka.Queue/DTOs/Reports/DashboardAnalyticsResponseDto.cs

namespace QueueLanka.Queue.DTOs.Reports;

public class DashboardAnalyticsResponseDto
{
    public string FromDate { get; set; } = string.Empty;
    public string ToDate { get; set; } = string.Empty;
    public int TotalBookings { get; set; }
    public int TotalServed { get; set; }
    public int TotalSkipped { get; set; }
    public int AverageWaitTimeSeconds { get; set; }
    public int PeakHour { get; set; }
    public int PeakHourTokenCount { get; set; }
    public List<DashboardAnalyticsDailyBookingDto> DailyBookings { get; set; } = new();
}

public class DashboardAnalyticsDailyBookingDto
{
    public string Date { get; set; } = string.Empty;
    public int Bookings { get; set; }
}