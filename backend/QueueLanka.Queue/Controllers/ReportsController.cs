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
}
