// backend/QueueLanka.Queue/Services/ReportService.cs

using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Reports;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text;

namespace QueueLanka.Queue.Services;

public class ReportService : IReportService
{
    private readonly IReportRepository _reportRepository;
    private static readonly HashSet<string> AllowedGroupBy =
        new(StringComparer.OrdinalIgnoreCase) { "date", "center", "date_center" };

    private static readonly HashSet<string> AllowedMetrics =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "total_tokens_issued",
            "total_served",
            "total_skipped",
            "total_cancelled",
            "no_show_count",
            "avg_wait_time_seconds",
            "avg_service_time_seconds",
            "active_counters"
        };

    private static readonly HashSet<string> AllowedStatuses =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "waiting",
            "called",
            "served",
            "completed",
            "skipped",
            "cancelled"
        };

    public ReportService(IReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public async Task<List<DailyCenterSummaryRowDto>> GetDailyCenterSummaryDataAsync(DailyCenterSummaryRequestDto request)
    {
        ValidateRequest(request);

        return await _reportRepository.GetDailyCenterSummaryAsync(
            request.FromDate.Date,
            request.ToDate.Date,
            request.CenterIds);
    }

    public async Task<(byte[] fileBytes, string fileName)> GenerateDailyCenterSummaryCsvAsync(DailyCenterSummaryRequestDto request)
    {
        ValidateRequest(request);

        var rows = await _reportRepository.GetDailyCenterSummaryAsync(
            request.FromDate.Date,
            request.ToDate.Date,
            request.CenterIds);

        var csvBuilder = new StringBuilder();
        csvBuilder.AppendLine("Date,Center ID,Center Name,Tokens Issued,Served,Skipped,Cancelled,No Shows,Avg Wait Time (min),Avg Service Time (min),Peak Hour,Peak Hour Tokens,Active Counters");

        foreach (var row in rows)
        {
            csvBuilder.Append(row.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)).Append(',');
            csvBuilder.Append(row.CenterId).Append(',');
            csvBuilder.Append(EscapeCsv(row.CenterName)).Append(',');
            csvBuilder.Append(row.TotalTokensIssued).Append(',');
            csvBuilder.Append(row.TotalServed).Append(',');
            csvBuilder.Append(row.TotalSkipped).Append(',');
            csvBuilder.Append(row.TotalCancelled).Append(',');
            csvBuilder.Append(row.NoShowCount).Append(',');
            csvBuilder.Append(FormatMinutes(row.AverageWaitTimeSeconds)).Append(',');
            csvBuilder.Append(FormatMinutes(row.AverageServiceTimeSeconds)).Append(',');
            csvBuilder.Append($"{row.PeakHour:D2}:00").Append(',');
            csvBuilder.Append(row.PeakHourTokenCount).Append(',');
            csvBuilder.Append(row.ActiveCounters).AppendLine();
        }

        if (rows.Count > 0)
        {
            csvBuilder
                .Append("Total")
                .Append(',')
                .Append(',')
                .Append(',')
                .Append(rows.Sum(r => r.TotalTokensIssued)).Append(',')
                .Append(rows.Sum(r => r.TotalServed)).Append(',')
                .Append(rows.Sum(r => r.TotalSkipped)).Append(',')
                .Append(rows.Sum(r => r.TotalCancelled)).Append(',')
                .Append(rows.Sum(r => r.NoShowCount)).Append(',')
                .Append(',')
                .Append(',')
                .Append(',')
                .Append(rows.Sum(r => r.PeakHourTokenCount)).Append(',')
                .Append(rows.Sum(r => r.ActiveCounters))
                .AppendLine();
        }

        var fileName = $"QueueLanka_DailySummary_{request.FromDate:yyyyMMdd}_{request.ToDate:yyyyMMdd}.csv";

        var bom = Encoding.UTF8.GetPreamble();
        var csvBytes = Encoding.UTF8.GetBytes(csvBuilder.ToString());
        var fileBytes = new byte[bom.Length + csvBytes.Length];
        Buffer.BlockCopy(bom, 0, fileBytes, 0, bom.Length);
        Buffer.BlockCopy(csvBytes, 0, fileBytes, bom.Length, csvBytes.Length);

        return (fileBytes, fileName);
    }

    public async Task<CustomReportResponseDto> GetCustomReportAsync(CustomReportQueryDto request)
    {
        ValidateCustomRequest(request);

        var normalizedMetrics = request.Metrics
            .Where(metric => !string.IsNullOrWhiteSpace(metric))
            .Select(metric => metric.Trim().ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        request.Metrics = normalizedMetrics;
        request.GroupBy = request.GroupBy.Trim().ToLowerInvariant();
        request.Statuses = request.Statuses
            .Where(status => !string.IsNullOrWhiteSpace(status))
            .Select(status => status.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var (rows, totalGroups) = await _reportRepository.GetCustomReportAsync(request, normalizedMetrics);

        return new CustomReportResponseDto
        {
            GroupBy = request.GroupBy,
            Metrics = normalizedMetrics,
            Page = request.Page,
            PageSize = request.PageSize,
            TotalGroups = totalGroups,
            Rows = rows
        };
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        var escaped = value.Replace("\"", "\"\"");
        return $"\"{escaped}\"";
    }

    private static string FormatMinutes(int totalSeconds)
    {
        var minutes = totalSeconds / 60d;
        return minutes.ToString("0.0", CultureInfo.InvariantCulture);
    }

    private static void ValidateRequest(DailyCenterSummaryRequestDto request)
    {
        if (request.ToDate.Date < request.FromDate.Date)
        {
            throw new ValidationException("ToDate must be greater than or equal to FromDate.");
        }

        if ((request.ToDate.Date - request.FromDate.Date).TotalDays > 90)
        {
            throw new ValidationException("Date range cannot exceed 90 days.");
        }
    }

    private static void ValidateCustomRequest(CustomReportQueryDto request)
    {
        if (request.ToDate.Date < request.FromDate.Date)
        {
            throw new ValidationException("ToDate must be greater than or equal to FromDate.");
        }

        if ((request.ToDate.Date - request.FromDate.Date).TotalDays > 90)
        {
            throw new ValidationException("Date range cannot exceed 90 days.");
        }

        if (request.Page < 1)
        {
            throw new ValidationException("Page must be greater than or equal to 1.");
        }

        if (request.PageSize < 1 || request.PageSize > 500)
        {
            throw new ValidationException("PageSize must be between 1 and 500.");
        }

        if (request.Metrics.Count == 0)
        {
            throw new ValidationException("At least one metric must be selected.");
        }

        var unsupportedMetrics = request.Metrics
            .Where(metric => !AllowedMetrics.Contains(metric.Trim()))
            .ToList();
        if (unsupportedMetrics.Count > 0)
        {
            throw new ValidationException($"Unsupported metrics: {string.Join(", ", unsupportedMetrics)}");
        }

        var unsupportedStatuses = request.Statuses
            .Where(status => !AllowedStatuses.Contains(status.Trim()))
            .ToList();
        if (unsupportedStatuses.Count > 0)
        {
            throw new ValidationException($"Unsupported statuses: {string.Join(", ", unsupportedStatuses)}");
        }

        if (!AllowedGroupBy.Contains(request.GroupBy.Trim()))
        {
            throw new ValidationException("groupBy must be one of: date, center, date_center.");
        }
    }
}
