// backend/QueueLanka.Queue/Data/IReportRepository.cs

using QueueLanka.Queue.DTOs.Reports;

namespace QueueLanka.Queue.Data;

public interface IReportRepository
{
    Task<DashboardAnalyticsResponseDto> GetDashboardAnalyticsAsync(
        DateTime fromDate,
        DateTime toDate,
        List<int>? centerIds);

    Task<List<DailyCenterSummaryRowDto>> GetDailyCenterSummaryAsync(
        DateTime fromDate,
        DateTime toDate,
        List<int>? centerIds);

    Task<List<DailyCenterSummaryRowDto>> GetDailyCenterSummaryPageAsync(
        DateTime fromDate,
        DateTime toDate,
        List<int>? centerIds,
        int page,
        int pageSize);

    Task<int> GetDailyCenterSummaryCountAsync(
        DateTime fromDate,
        DateTime toDate,
        List<int>? centerIds);
}
