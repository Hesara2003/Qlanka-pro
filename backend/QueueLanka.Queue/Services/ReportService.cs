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
}
