// backend/QueueLanka.Queue/Services/IReportService.cs

using QueueLanka.Queue.DTOs.Reports;

namespace QueueLanka.Queue.Services;

public interface IReportService
{
    DailyCenterSummaryRequestDto CreateDailyCenterSummaryRequest(
        DateTime fromDate,
        DateTime toDate,
        string? centerIds,
        string? format = "csv");

    DailyCenterSummaryRequestDto CreateCenterDailySummaryRequest(
        int centerId,
        DateTime fromDate,
        DateTime toDate,
        string? format = "csv");

    Task<(byte[] fileBytes, string fileName)> GenerateDailyCenterSummaryCsvAsync(DailyCenterSummaryRequestDto request);
    Task<List<DailyCenterSummaryRowDto>> GetDailyCenterSummaryDataAsync(DailyCenterSummaryRequestDto request);
}
