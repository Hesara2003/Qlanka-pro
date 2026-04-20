// backend/QueueLanka.Queue/Controllers/ReportsController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QueueLanka.Queue.DTOs.Reports;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.DTOs.Common;
using System.ComponentModel.DataAnnotations;

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
        [FromQuery] int pageSize = 100)
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
}
