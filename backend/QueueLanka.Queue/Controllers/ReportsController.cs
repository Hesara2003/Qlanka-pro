// backend/QueueLanka.Queue/Controllers/ReportsController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QueueLanka.Queue.DTOs.Reports;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.DTOs.Common;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text;

namespace QueueLanka.Queue.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Policy = "AdminOnly")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("/reports/custom")]
    [HttpGet("custom")]
    [ResponseCache(NoStore = true)]
    [ProducesResponseType(typeof(ApiResponse<CustomReportResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetCustomReport(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] string? centerIds,
        [FromQuery] string? statuses,
        [FromQuery] string metrics,
        [FromQuery] string groupBy = "date_center",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100,
        [FromQuery] string format = "json",
        [FromQuery] bool exportAll = false)
    {
        try
        {
            var request = new CustomReportQueryDto
            {
                FromDate = fromDate,
                ToDate = toDate,
                CenterIds = ParseCenterIds(centerIds),
                Statuses = ParseCsvValues(statuses),
                Metrics = ParseCsvValues(metrics),
                GroupBy = string.IsNullOrWhiteSpace(groupBy) ? "date_center" : groupBy,
                Page = page,
                PageSize = pageSize
            };

            if (!TryValidateModel(request))
            {
                return BadRequest(new ErrorResponse("VALIDATION_ERROR", "Invalid custom report request parameters."));
            }

            var result = await _reportService.GetCustomReportAsync(request);

            var normalizedFormat = string.IsNullOrWhiteSpace(format)
                ? "json"
                : format.Trim().ToLowerInvariant();

            if (normalizedFormat == "csv")
            {
                if (exportAll)
                {
                    return await StreamCustomReportCsvAsync(request);
                }

                if (result.Rows.Count == 0)
                {
                    return NoContent();
                }

                var csvBytes = BuildCustomReportCsv(result);
                var fileName = $"QueueLanka_CustomReport_{request.FromDate:yyyyMMdd}_{request.ToDate:yyyyMMdd}.csv";
                return File(csvBytes, "text/csv", fileName);
            }

            if (normalizedFormat == "pdf")
            {
                if (result.Rows.Count == 0)
                {
                    return NoContent();
                }

                var pdfBytes = BuildCustomReportPdf(result, request);
                var fileName = $"QueueLanka_CustomReport_{request.FromDate:yyyyMMdd}_{request.ToDate:yyyyMMdd}.pdf";
                return File(pdfBytes, "application/pdf", fileName);
            }

            if (normalizedFormat != "json")
            {
                return BadRequest(new ErrorResponse("INVALID_FORMAT", "format must be one of: json, csv, pdf."));
            }

            var response = new ApiResponse<CustomReportResponseDto>(
                result,
                new ResponseMetadata
                {
                    TotalCount = result.TotalGroups,
                    Page = result.Page,
                    PageSize = result.PageSize
                },
                "Custom report generated successfully.");

            return Ok(response);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new ErrorResponse("VALIDATION_ERROR", ex.Message));
        }
        catch (FormatException ex)
        {
            return BadRequest(new ErrorResponse("INVALID_FILTERS", ex.Message));
        }
    }

    [HttpGet("daily-summary/csv")]
    [ResponseCache(NoStore = true)]
    [Produces("text/csv")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDailySummaryCsv(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] string? centerIds,
        [FromQuery] string? format = "csv")
    {
        try
        {
            var parsedCenterIds = ParseCenterIds(centerIds);

            var request = new DailyCenterSummaryRequestDto
            {
                FromDate = fromDate,
                ToDate = toDate,
                CenterIds = parsedCenterIds,
                Format = string.IsNullOrWhiteSpace(format) ? "csv" : format
            };

            if (!TryValidateModel(request))
            {
                return BadRequest(new ErrorResponse("VALIDATION_ERROR", "Invalid report request parameters."));
            }

            var data = await _reportService.GetDailyCenterSummaryDataAsync(request);
            if (data.Count == 0)
            {
                return NoContent();
            }

            var (fileBytes, fileName) = await _reportService.GenerateDailyCenterSummaryCsvAsync(request);
            return File(fileBytes, "text/csv", fileName);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new ErrorResponse("VALIDATION_ERROR", ex.Message));
        }
        catch (FormatException ex)
        {
            return BadRequest(new ErrorResponse("INVALID_CENTER_FILTER", ex.Message));
        }
    }

    [HttpGet("/reports/centers/{id}/summary")]
    [HttpGet("centers/{id}/summary")]
    [ResponseCache(NoStore = true)]
    [Produces("text/csv")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetCenterSummaryCsv(
        [FromRoute] int id,
        [FromQuery(Name = "from")] DateTime fromDate,
        [FromQuery(Name = "to")] DateTime toDate,
        [FromQuery] string? format = "csv")
    {
        try
        {
            var request = new DailyCenterSummaryRequestDto
            {
                FromDate = fromDate,
                ToDate = toDate,
                CenterIds = new List<int> { id },
                Format = string.IsNullOrWhiteSpace(format) ? "csv" : format
            };

            if (!TryValidateModel(request))
            {
                return BadRequest(new ErrorResponse("VALIDATION_ERROR", "Invalid report request parameters."));
            }

            var data = await _reportService.GetDailyCenterSummaryDataAsync(request);
            if (data.Count == 0)
            {
                return NoContent();
            }

            var (fileBytes, fileName) = await _reportService.GenerateDailyCenterSummaryCsvAsync(request);
            return File(fileBytes, "text/csv", fileName);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new ErrorResponse("VALIDATION_ERROR", ex.Message));
        }
        catch (FormatException ex)
        {
            return BadRequest(new ErrorResponse("INVALID_CENTER_FILTER", ex.Message));
        }
    }

    private static List<int> ParseCenterIds(string? centerIds)
    {
        if (string.IsNullOrWhiteSpace(centerIds))
        {
            return new List<int>();
        }

        var values = centerIds
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

        return values;
    }

    private static List<string> ParseCsvValues(string? values)
    {
        if (string.IsNullOrWhiteSpace(values))
        {
            return new List<string>();
        }

        return values
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static byte[] BuildCustomReportCsv(CustomReportResponseDto report)
    {
        var csv = new StringBuilder();

        var headers = new List<string>();
        var includesDate = report.GroupBy.Equals("date", StringComparison.OrdinalIgnoreCase)
                           || report.GroupBy.Equals("date_center", StringComparison.OrdinalIgnoreCase);
        var includesCenter = report.GroupBy.Equals("center", StringComparison.OrdinalIgnoreCase)
                             || report.GroupBy.Equals("date_center", StringComparison.OrdinalIgnoreCase);

        if (includesDate)
        {
            headers.Add("Date");
        }

        if (includesCenter)
        {
            headers.Add("Center ID");
            headers.Add("Center Name");
        }

        headers.AddRange(report.Metrics);
        csv.AppendLine(string.Join(',', headers));

        foreach (var row in report.Rows)
        {
            var fields = new List<string>();
            if (includesDate)
            {
                fields.Add(row.Date?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty);
            }

            if (includesCenter)
            {
                fields.Add(row.CenterId?.ToString(CultureInfo.InvariantCulture) ?? string.Empty);
                fields.Add(EscapeCsv(row.CenterName ?? string.Empty));
            }

            foreach (var metric in report.Metrics)
            {
                fields.Add(row.Metrics.TryGetValue(metric, out var value)
                    ? value.ToString("0.##", CultureInfo.InvariantCulture)
                    : "0");
            }

            csv.AppendLine(string.Join(',', fields));
        }

        var bom = Encoding.UTF8.GetPreamble();
        var body = Encoding.UTF8.GetBytes(csv.ToString());
        var bytes = new byte[bom.Length + body.Length];
        Buffer.BlockCopy(bom, 0, bytes, 0, bom.Length);
        Buffer.BlockCopy(body, 0, bytes, bom.Length, body.Length);
        return bytes;
    }

    private static byte[] BuildCustomReportPdf(CustomReportResponseDto report, CustomReportQueryDto request)
    {
        var includesDate = report.GroupBy.Equals("date", StringComparison.OrdinalIgnoreCase)
                           || report.GroupBy.Equals("date_center", StringComparison.OrdinalIgnoreCase);
        var includesCenter = report.GroupBy.Equals("center", StringComparison.OrdinalIgnoreCase)
                             || report.GroupBy.Equals("date_center", StringComparison.OrdinalIgnoreCase);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(column =>
                {
                    column.Item().Text("QueueLanka Custom Report").Bold().FontSize(16);
                    column.Item().Text($"Date range: {request.FromDate:yyyy-MM-dd} to {request.ToDate:yyyy-MM-dd}");
                    column.Item().Text($"Group By: {report.GroupBy}");
                    column.Item().Text($"Metrics: {string.Join(", ", report.Metrics)}");
                });

                page.Content().Table(table =>
                {
                    var columnCount = (includesDate ? 1 : 0) + (includesCenter ? 2 : 0) + report.Metrics.Count;
                    table.ColumnsDefinition(columns =>
                    {
                        for (var i = 0; i < columnCount; i++)
                        {
                            columns.RelativeColumn();
                        }
                    });

                    table.Header(header =>
                    {
                        if (includesDate)
                        {
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Date").Bold();
                        }

                        if (includesCenter)
                        {
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Center ID").Bold();
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Center Name").Bold();
                        }

                        foreach (var metric in report.Metrics)
                        {
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text(metric).Bold();
                        }
                    });

                    foreach (var row in report.Rows)
                    {
                        if (includesDate)
                        {
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(3)
                                .Text(row.Date?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty);
                        }

                        if (includesCenter)
                        {
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(3)
                                .Text(row.CenterId?.ToString(CultureInfo.InvariantCulture) ?? string.Empty);
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(3)
                                .Text(row.CenterName ?? string.Empty);
                        }

                        foreach (var metric in report.Metrics)
                        {
                            var value = row.Metrics.TryGetValue(metric, out var metricValue)
                                ? metricValue.ToString("0.##", CultureInfo.InvariantCulture)
                                : "0";

                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(3).Text(value);
                        }
                    }
                });

                page.Footer().AlignRight().Text(text =>
                {
                    text.Span("Generated: ");
                    text.Span(DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss 'UTC'", CultureInfo.InvariantCulture));
                });
            });
        });

        return document.GeneratePdf();
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

    private async Task<IActionResult> StreamCustomReportCsvAsync(CustomReportQueryDto request)
    {
        var firstPageRequest = CloneRequestForPage(request, request.Page);
        var firstPage = await _reportService.GetCustomReportAsync(firstPageRequest);
        if (firstPage.Rows.Count == 0)
        {
            return NoContent();
        }

        var fileName = $"QueueLanka_CustomReport_{request.FromDate:yyyyMMdd}_{request.ToDate:yyyyMMdd}.csv";
        Response.StatusCode = StatusCodes.Status200OK;
        Response.ContentType = "text/csv";
        Response.Headers.ContentDisposition =
            new ContentDispositionHeaderValue("attachment") { FileName = fileName }.ToString();

        await using var writer = new StreamWriter(Response.Body, new UTF8Encoding(true), 1024, leaveOpen: true);

        var includesDate = firstPage.GroupBy.Equals("date", StringComparison.OrdinalIgnoreCase)
                           || firstPage.GroupBy.Equals("date_center", StringComparison.OrdinalIgnoreCase);
        var includesCenter = firstPage.GroupBy.Equals("center", StringComparison.OrdinalIgnoreCase)
                             || firstPage.GroupBy.Equals("date_center", StringComparison.OrdinalIgnoreCase);

        var headers = new List<string>();
        if (includesDate)
        {
            headers.Add("Date");
        }

        if (includesCenter)
        {
            headers.Add("Center ID");
            headers.Add("Center Name");
        }

        headers.AddRange(firstPage.Metrics);
        await writer.WriteLineAsync(string.Join(',', headers));

        await WriteCsvRowsAsync(writer, firstPage, includesDate, includesCenter);

        var currentPage = request.Page + 1;
        while ((currentPage - 1) * request.PageSize < firstPage.TotalGroups)
        {
            var pageRequest = CloneRequestForPage(request, currentPage);
            var pageResult = await _reportService.GetCustomReportAsync(pageRequest);
            if (pageResult.Rows.Count == 0)
            {
                break;
            }

            await WriteCsvRowsAsync(writer, pageResult, includesDate, includesCenter);
            currentPage++;
        }

        await writer.FlushAsync();
        return new EmptyResult();
    }

    private static async Task WriteCsvRowsAsync(
        StreamWriter writer,
        CustomReportResponseDto page,
        bool includesDate,
        bool includesCenter)
    {
        foreach (var row in page.Rows)
        {
            var fields = new List<string>();
            if (includesDate)
            {
                fields.Add(row.Date?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty);
            }

            if (includesCenter)
            {
                fields.Add(row.CenterId?.ToString(CultureInfo.InvariantCulture) ?? string.Empty);
                fields.Add(EscapeCsv(row.CenterName ?? string.Empty));
            }

            foreach (var metric in page.Metrics)
            {
                fields.Add(row.Metrics.TryGetValue(metric, out var value)
                    ? value.ToString("0.##", CultureInfo.InvariantCulture)
                    : "0");
            }

            await writer.WriteLineAsync(string.Join(',', fields));
        }
    }

    private static CustomReportQueryDto CloneRequestForPage(CustomReportQueryDto source, int page)
    {
        return new CustomReportQueryDto
        {
            FromDate = source.FromDate,
            ToDate = source.ToDate,
            CenterIds = source.CenterIds.ToList(),
            Statuses = source.Statuses.ToList(),
            Metrics = source.Metrics.ToList(),
            GroupBy = source.GroupBy,
            Page = page,
            PageSize = source.PageSize
        };
    }
}
