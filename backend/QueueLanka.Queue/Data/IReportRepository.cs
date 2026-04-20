// backend/QueueLanka.Queue/Data/IReportRepository.cs

using QueueLanka.Queue.DTOs.Reports;

namespace QueueLanka.Queue.Data;

public interface IReportRepository
{
    Task<List<DailyCenterSummaryRowDto>> GetDailyCenterSummaryAsync(
        DateTime fromDate,
        DateTime toDate,
        List<int>? centerIds);

    Task<(List<CustomReportRowDto> rows, int totalGroups)> GetCustomReportAsync(
        CustomReportQueryDto request,
        IReadOnlyCollection<string> selectedMetrics);
}
