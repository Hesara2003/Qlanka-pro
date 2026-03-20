// backend/QueueLanka.Queue/Services/IReportService.cs

using QueueLanka.Queue.DTOs.Reports;

namespace QueueLanka.Queue.Services;

public interface IReportService
{
    Task<(byte[] fileBytes, string fileName)> GenerateDailyCenterSummaryCsvAsync(DailyCenterSummaryRequestDto request);
    Task<List<DailyCenterSummaryRowDto>> GetDailyCenterSummaryDataAsync(DailyCenterSummaryRequestDto request);
}
