// backend/QueueLanka.Queue/Services/ReportService.cs

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Reports;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text;

namespace QueueLanka.Queue.Services;

public class ReportService : IReportService
{
    private readonly IReportRepository _reportRepository;

    static ReportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private static readonly IReadOnlyDictionary<string, CustomReportMetricDefinition> CustomMetrics =
        new Dictionary<string, CustomReportMetricDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            ["totaltokensissued"] = new("Tokens Issued", row => row.TotalTokensIssued, true),
            ["issued"] = new("Tokens Issued", row => row.TotalTokensIssued, true),
            ["totalserved"] = new("Served", row => row.TotalServed, true),
            ["served"] = new("Served", row => row.TotalServed, true),
            ["totalskipped"] = new("Skipped", row => row.TotalSkipped, true),
            ["skipped"] = new("Skipped", row => row.TotalSkipped, true),
            ["totalcancelled"] = new("Cancelled", row => row.TotalCancelled, true),
            ["cancelled"] = new("Cancelled", row => row.TotalCancelled, true),
            ["noshowcount"] = new("No Shows", row => row.NoShowCount, true),
            ["noShows"] = new("No Shows", row => row.NoShowCount, true),
            ["averagewaittimeseconds"] = new("Avg Wait Time (min)", row => FormatMinutes(row.AverageWaitTimeSeconds), false),
            ["avgwaittime"] = new("Avg Wait Time (min)", row => FormatMinutes(row.AverageWaitTimeSeconds), false),
            ["averageservicetimeseconds"] = new("Avg Service Time (min)", row => FormatMinutes(row.AverageServiceTimeSeconds), false),
            ["avgservicetime"] = new("Avg Service Time (min)", row => FormatMinutes(row.AverageServiceTimeSeconds), false),
            ["peakhour"] = new("Peak Hour", row => $"{row.PeakHour:D2}:00", false),
            ["peakhourtokencount"] = new("Peak Hour Tokens", row => row.PeakHourTokenCount, true),
            ["activecounters"] = new("Active Counters", row => row.ActiveCounters, true)
        };

    private static readonly IReadOnlyList<string> DefaultCustomMetrics =
    [
        "totalTokensIssued",
        "totalServed",
        "totalSkipped",
        "totalCancelled",
        "noShowCount",
        "averageWaitTimeSeconds",
        "averageServiceTimeSeconds",
        "peakHour",
        "peakHourTokenCount",
        "activeCounters"
    ];

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

    public CustomReportRequestDto CreateCustomReportRequest(
        DateTime fromDate,
        DateTime toDate,
        string? centerIds,
        string? metrics,
        string? format = "csv")
    {
        var request = new CustomReportRequestDto
        {
            FromDate = fromDate,
            ToDate = toDate,
            CenterIds = ParseCenterIds(centerIds),
            Metrics = ParseMetrics(metrics),
            Format = string.IsNullOrWhiteSpace(format) ? "csv" : format
        };

        ValidateMetrics(request.Metrics);
        ValidateSupportedFormat(request.Format);
        return request;
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

    public async Task<List<DailyCenterSummaryRowDto>> GetCustomReportDataAsync(CustomReportRequestDto request)
    {
        ValidateRequest(request);
        ValidateMetrics(request.Metrics);

        return await _reportRepository.GetDailyCenterSummaryAsync(
            request.FromDate.Date,
            request.ToDate.Date,
            request.CenterIds);
    }

    public async Task<CustomReportPreviewDto> GetCustomReportPreviewAsync(CustomReportRequestDto request)
    {
        var table = await BuildCustomReportTableAsync(request);

        return new CustomReportPreviewDto
        {
            FromDate = request.FromDate.Date,
            ToDate = request.ToDate.Date,
            Headers = table.Headers,
            Rows = table.Rows,
            TotalRow = table.TotalRow
        };
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

    public async Task<(byte[] fileBytes, string fileName)> GenerateCustomReportCsvAsync(CustomReportRequestDto request)
    {
        var table = await BuildCustomReportTableAsync(request);

        var csvBuilder = new StringBuilder();
        csvBuilder.AppendLine(string.Join(',', table.Headers.Select(EscapeCsvCell)));

        foreach (var row in table.Rows)
        {
            csvBuilder.AppendLine(string.Join(',', row.Select(EscapeCsvCell)));
        }

        if (table.TotalRow is not null)
        {
            csvBuilder.AppendLine(string.Join(',', table.TotalRow.Select(EscapeCsvCell)));
        }

        var fileName = $"QueueLanka_CustomReport_{request.FromDate:yyyyMMdd}_{request.ToDate:yyyyMMdd}.csv";
        var bom = Encoding.UTF8.GetPreamble();
        var csvBytes = Encoding.UTF8.GetBytes(csvBuilder.ToString());
        var fileBytes = new byte[bom.Length + csvBytes.Length];
        Buffer.BlockCopy(bom, 0, fileBytes, 0, bom.Length);
        Buffer.BlockCopy(csvBytes, 0, fileBytes, bom.Length, csvBytes.Length);

        return (fileBytes, fileName);
    }

    public async Task<(byte[] fileBytes, string fileName)> GenerateCustomReportPdfAsync(CustomReportRequestDto request)
    {
        var table = await BuildCustomReportTableAsync(request);

        var fileName = $"QueueLanka_CustomReport_{request.FromDate:yyyyMMdd}_{request.ToDate:yyyyMMdd}.pdf";
        var pdfBytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text("QueueLanka Custom Report").Bold().FontSize(16);
                    col.Item().Text($"Range: {request.FromDate:yyyy-MM-dd} to {request.ToDate:yyyy-MM-dd}").FontSize(10);
                });

                page.Content().PaddingTop(10).Table(tableBuilder =>
                {
                    tableBuilder.ColumnsDefinition(cols =>
                    {
                        for (var i = 0; i < table.Headers.Count; i++)
                        {
                            cols.RelativeColumn();
                        }
                    });

                    tableBuilder.Header(header =>
                    {
                        foreach (var heading in table.Headers)
                        {
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text(heading).SemiBold();
                        }
                    });

                    foreach (var row in table.Rows)
                    {
                        foreach (var cell in row)
                        {
                            tableBuilder.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(4).Text(cell);
                        }
                    }

                    if (table.TotalRow is not null)
                    {
                        foreach (var totalCell in table.TotalRow)
                        {
                            tableBuilder.Cell().Background(Colors.Grey.Lighten4).Padding(4).Text(totalCell).SemiBold();
                        }
                    }
                });
            });
        }).GeneratePdf();

        return (pdfBytes, fileName);
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

    private static void ValidateRequest(CustomReportRequestDto request)
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

        ValidateSupportedFormat(request.Format);
    }

    private static void ValidateSupportedFormat(string format)
    {
        if (string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(format, "pdf", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        throw new ValidationException("format must be either 'csv' or 'pdf'.");
    }

    private static void ValidateMetrics(List<string> metrics)
    {
        if (metrics.Count == 0)
        {
            return;
        }

        foreach (var metric in metrics)
        {
            if (!CustomMetrics.ContainsKey(metric))
            {
                throw new FormatException($"Unknown metric '{metric}'.");
            }
        }
    }

    private static IReadOnlyList<CustomReportMetricDefinition> ResolveMetricDefinitions(List<string> metrics)
    {
        var selected = metrics.Count == 0 ? DefaultCustomMetrics : metrics;

        return selected
            .Select(metric =>
            {
                if (!CustomMetrics.TryGetValue(metric, out var definition))
                {
                    throw new FormatException($"Unknown metric '{metric}'.");
                }

                return definition;
            })
            .ToList();
    }

    private static string SumMetric(List<DailyCenterSummaryRowDto> rows, CustomReportMetricDefinition metric)
    {
        return metric.SumSelector(rows).ToString(CultureInfo.InvariantCulture);
    }

    private async Task<CustomReportTable> BuildCustomReportTableAsync(CustomReportRequestDto request)
    {
        ValidateRequest(request);
        ValidateMetrics(request.Metrics);

        var selectedMetrics = ResolveMetricDefinitions(request.Metrics);
        var rows = await _reportRepository.GetDailyCenterSummaryAsync(
            request.FromDate.Date,
            request.ToDate.Date,
            request.CenterIds);

        var headers = new List<string> { "Date", "Center ID", "Center Name" };
        headers.AddRange(selectedMetrics.Select(x => x.HeaderName));

        var dataRows = rows
            .Select(row =>
            {
                var values = new List<string>
                {
                    row.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    row.CenterId.ToString(CultureInfo.InvariantCulture),
                    row.CenterName
                };

                values.AddRange(selectedMetrics.Select(metric => metric.FormatValue(row)));
                return (IReadOnlyList<string>)values;
            })
            .ToList();

        IReadOnlyList<string>? totalRow = null;
        if (rows.Count > 0)
        {
            var totals = new List<string> { "Total", string.Empty, string.Empty };
            totals.AddRange(selectedMetrics.Select(metric => metric.IncludeInTotals ? SumMetric(rows, metric) : string.Empty));
            totalRow = totals;
        }

        return new CustomReportTable
        {
            Headers = headers,
            Rows = dataRows,
            TotalRow = totalRow
        };
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

    private static List<string> ParseMetrics(string? metrics)
    {
        if (string.IsNullOrWhiteSpace(metrics))
        {
            return new List<string>();
        }

        return metrics
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(NormalizeMetricName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string NormalizeMetricName(string metric)
    {
        return metric.Replace("-", string.Empty, StringComparison.Ordinal)
            .Replace("_", string.Empty, StringComparison.Ordinal)
            .Trim();
    }

    private static string EscapeCsvCell(string value)
    {
        var escaped = value.Replace("\"", "\"\"");
        return $"\"{escaped}\"";
    }

    private sealed record CustomReportMetricDefinition(
        string HeaderName,
        Func<DailyCenterSummaryRowDto, object> ValueSelector,
        bool IncludeInTotals)
    {
        public string FormatValue(DailyCenterSummaryRowDto row)
        {
            return ValueSelector(row).ToString() ?? string.Empty;
        }

        public Func<List<DailyCenterSummaryRowDto>, int> SumSelector => rows =>
        {
            var sum = rows.Sum(row => ValueSelector(row) switch
            {
                int intValue => intValue,
                string stringValue when int.TryParse(stringValue, out var parsed) => parsed,
                _ => 0
            });

            return sum;
        };
    }

    private sealed class CustomReportTable
    {
        public IReadOnlyList<string> Headers { get; set; } = Array.Empty<string>();
        public IReadOnlyList<IReadOnlyList<string>> Rows { get; set; } = Array.Empty<IReadOnlyList<string>>();
        public IReadOnlyList<string>? TotalRow { get; set; }
    }
}
