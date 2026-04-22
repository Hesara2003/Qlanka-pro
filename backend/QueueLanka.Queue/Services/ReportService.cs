// backend/QueueLanka.Queue/Services/ReportService.cs

using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Reports;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text;

namespace QueueLanka.Queue.Services;

public class ReportService : IReportService
{
    private static readonly HashSet<string> SupportedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Waiting",
        "Called",
        "Served",
        "Completed",
        "Skipped",
        "Cancelled"
    };

    private static readonly Dictionary<string, string> SupportedMetrics = new(StringComparer.OrdinalIgnoreCase)
    {
        ["totalAppointments"] = "totalAppointments",
        ["totalQueuedUsers"] = "totalQueuedUsers",
        ["completedTokens"] = "completedTokens",
        ["cancelledAppointments"] = "cancelledAppointments",
        ["totalTokensIssued"] = "totalTokensIssued",
        ["serviceCount"] = "serviceCount",
        ["averageWaitingTimeSeconds"] = "averageWaitingTimeSeconds",
        ["averageServiceTimeSeconds"] = "averageServiceTimeSeconds"
    };

    private static readonly List<string> DefaultMetrics =
    [
        "totalAppointments",
        "totalQueuedUsers",
        "completedTokens",
        "cancelledAppointments",
        "totalTokensIssued",
        "serviceCount",
        "averageWaitingTimeSeconds",
        "averageServiceTimeSeconds"
    ];

    private readonly IReportRepository _reportRepository;

    public ReportService(IReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public DailyCenterSummaryRequestDto CreateDailyCenterSummaryRequest(
        DateTime fromDate,
        DateTime toDate,
        string? centerIds,
        string? format = "csv")
    {
        return new DailyCenterSummaryRequestDto
        {
            FromDate = fromDate,
            ToDate = toDate,
            CenterIds = ParseCenterIds(centerIds),
            Format = string.IsNullOrWhiteSpace(format) ? "csv" : format
        };
    }

    public DailyCenterSummaryRequestDto CreateCenterDailySummaryRequest(
        int centerId,
        DateTime fromDate,
        DateTime toDate,
        string? format = "csv")
    {
        if (centerId <= 0)
        {
            throw new ValidationException("Center id must be greater than zero.");
        }

        return new DailyCenterSummaryRequestDto
        {
            FromDate = fromDate,
            ToDate = toDate,
            CenterIds = new List<int> { centerId },
            Format = string.IsNullOrWhiteSpace(format) ? "csv" : format
        };
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

    public CustomReportRequestDto CreateCustomReportRequest(
        DateTime? fromDate,
        DateTime? toDate,
        string? centerIds,
        string? statuses,
        string? metrics)
    {
        var resolvedToDate = (toDate ?? DateTime.UtcNow.Date).Date;
        var resolvedFromDate = (fromDate ?? resolvedToDate.AddDays(-30)).Date;

        return new CustomReportRequestDto
        {
            FromDate = resolvedFromDate,
            ToDate = resolvedToDate,
            CenterIds = ParsePositiveCenterIds(centerIds),
            Statuses = ParseStatuses(statuses),
            Metrics = ParseMetrics(metrics)
        };
    }

    public async Task<CustomReportResponseDto> GetCustomReportAsync(CustomReportRequestDto request)
    {
        ValidateCustomRequest(request);

        var aggregate = await _reportRepository.GetCustomReportAggregatesAsync(
            request.FromDate.Date,
            request.ToDate.Date,
            request.CenterIds,
            request.Statuses);

        var metricValues = BuildMetricMap(aggregate);
        var selectedMetrics = request.Metrics
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(metric => SupportedMetrics[metric])
            .ToList();

        var selectedValues = selectedMetrics.ToDictionary(
            metric => metric,
            metric => metricValues[metric],
            StringComparer.OrdinalIgnoreCase);

        return new CustomReportResponseDto
        {
            AppliedFilters = new CustomReportFiltersDto
            {
                FromDate = request.FromDate.Date,
                ToDate = request.ToDate.Date,
                CenterIds = request.CenterIds,
                Statuses = request.Statuses
            },
            SelectedMetrics = selectedMetrics,
            AggregatedResults = selectedValues,
            GeneratedAtUtc = DateTime.UtcNow
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
        if (request.FromDate == default || request.ToDate == default)
        {
            throw new ValidationException("from/to dates are required.");
        }

        if (request.ToDate.Date < request.FromDate.Date)
        {
            throw new ValidationException("ToDate must be greater than or equal to FromDate.");
        }

        if ((request.ToDate.Date - request.FromDate.Date).TotalDays > 90)
        {
            throw new ValidationException("Date range cannot exceed 90 days.");
        }
    }

    private static void ValidateCustomRequest(CustomReportRequestDto request)
    {
        if (request.FromDate == default || request.ToDate == default)
        {
            throw new ValidationException("fromDate and toDate are required.");
        }

        if (request.ToDate.Date < request.FromDate.Date)
        {
            throw new ValidationException("ToDate must be greater than or equal to FromDate.");
        }

        if ((request.ToDate.Date - request.FromDate.Date).TotalDays > 90)
        {
            throw new ValidationException("Date range cannot exceed 90 days.");
        }

        if (request.Metrics.Count == 0)
        {
            throw new ValidationException("At least one metric must be selected.");
        }

        var unsupportedMetric = request.Metrics.FirstOrDefault(metric => !SupportedMetrics.ContainsKey(metric));
        if (!string.IsNullOrWhiteSpace(unsupportedMetric))
        {
            throw new ValidationException($"Unsupported metric '{unsupportedMetric}'.");
        }

        var unsupportedStatus = request.Statuses.FirstOrDefault(status => !SupportedStatuses.Contains(status));
        if (!string.IsNullOrWhiteSpace(unsupportedStatus))
        {
            throw new ValidationException($"Unsupported status '{unsupportedStatus}'.");
        }
    }

    private static List<int> ParseCenterIds(string? centerIds)
    {
        if (string.IsNullOrWhiteSpace(centerIds))
        {
            return new List<int>();
        }

        return centerIds
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(value =>
            {
                if (!int.TryParse(value, out var parsed))
                {
                    throw new FormatException("centerIds must be a comma-separated list of integers.");
                }

                return parsed;
            })
            .Distinct()
            .ToList();
    }

    private static List<int> ParsePositiveCenterIds(string? centerIds)
    {
        var parsed = ParseCenterIds(centerIds);
        if (parsed.Any(id => id <= 0))
        {
            throw new FormatException("centerIds must contain only positive integers.");
        }

        return parsed;
    }

    private static List<string> ParseStatuses(string? statuses)
    {
        if (string.IsNullOrWhiteSpace(statuses))
        {
            return new List<string>();
        }

        var parsedStatuses = statuses
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(raw =>
            {
                if (!SupportedStatuses.Contains(raw))
                {
                    throw new ValidationException($"Unsupported status '{raw}'.");
                }

                return SupportedStatuses.First(status => string.Equals(status, raw, StringComparison.OrdinalIgnoreCase));
            })
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return parsedStatuses;
    }

    private static List<string> ParseMetrics(string? metrics)
    {
        if (string.IsNullOrWhiteSpace(metrics))
        {
            return DefaultMetrics.ToList();
        }

        return metrics
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(metric =>
            {
                if (!SupportedMetrics.TryGetValue(metric, out var canonicalMetric))
                {
                    throw new ValidationException($"Unsupported metric '{metric}'.");
                }

                return canonicalMetric;
            })
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static Dictionary<string, decimal> BuildMetricMap(CustomReportAggregateDataDto aggregate)
    {
        return new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["totalAppointments"] = aggregate.TotalAppointments,
            ["totalQueuedUsers"] = aggregate.TotalQueuedUsers,
            ["completedTokens"] = aggregate.CompletedTokens,
            ["cancelledAppointments"] = aggregate.CancelledAppointments,
            ["totalTokensIssued"] = aggregate.TotalTokensIssued,
            ["serviceCount"] = aggregate.ServiceCount,
            ["averageWaitingTimeSeconds"] = aggregate.AverageWaitingTimeSeconds,
            ["averageServiceTimeSeconds"] = aggregate.AverageServiceTimeSeconds
        };
    }
}
