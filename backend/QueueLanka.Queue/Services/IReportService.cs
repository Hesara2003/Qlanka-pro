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

    DashboardAnalyticsRequestDto CreateDashboardAnalyticsRequest(
        DateTime fromDate,
        DateTime toDate,
        string? centerIds);

    CustomReportRequestDto CreateCustomReportRequest(
        DateTime fromDate,
        DateTime toDate,
        string? centerIds,
        string? metrics,
        string? format = "csv",
        int? page = null,
        int pageSize = 500);

    DailyCenterSummaryRequestDto CreateCenterDailySummaryRequest(
        int centerId,
        DateTime fromDate,
        DateTime toDate,
        string? format = "csv");

    Task<(byte[] fileBytes, string fileName)> GenerateDailyCenterSummaryCsvAsync(DailyCenterSummaryRequestDto request);
    Task<List<DailyCenterSummaryRowDto>> GetDailyCenterSummaryDataAsync(DailyCenterSummaryRequestDto request);
    Task<DashboardAnalyticsResponseDto> GetDashboardAnalyticsAsync(DashboardAnalyticsRequestDto request);
    Task<List<DailyCenterSummaryRowDto>> GetCustomReportDataAsync(CustomReportRequestDto request);
    Task<CustomReportPreviewDto> GetCustomReportPreviewAsync(CustomReportRequestDto request);
    Task<(byte[] fileBytes, string fileName)> GenerateCustomReportCsvAsync(CustomReportRequestDto request);
    Task StreamCustomReportCsvAsync(Stream output, CustomReportRequestDto request, CancellationToken cancellationToken = default);
    Task<(byte[] fileBytes, string fileName)> GenerateCustomReportPdfAsync(CustomReportRequestDto request);
}
