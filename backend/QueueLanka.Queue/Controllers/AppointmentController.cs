using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QueueLanka.Queue.DTOs.Appointment;
using QueueLanka.Shared.DTOs.Common;
using QueueLanka.Shared.Exceptions;
using QueueLanka.Queue.Services;
using System.Security.Claims;

namespace QueueLanka.Queue.Controllers;

[ApiController]
[Route("api/appointment")]
[Authorize]
public class AppointmentController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;
    private readonly ILogger<AppointmentController> _logger;

    public AppointmentController(
        IAppointmentService appointmentService,
        ILogger<AppointmentController> logger)
    {
        _appointmentService = appointmentService;
        _logger             = logger;
    }

    [HttpPost("book")]
    [ProducesResponseType(typeof(ApiResponse<AppointmentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> BookToken([FromBody] BookAppointmentRequestDto requestDto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            _logger.LogWarning("BookToken: missing or invalid NameIdentifier claim");
            return Unauthorized(new ErrorResponse("INVALID_TOKEN", "Invalid user token."));
        }

        try
        {
            var result = await _appointmentService.BookTokenAsync(userId, requestDto);

            var response = new ApiResponse<AppointmentResponseDto>(
                result,
                new ResponseMetadata { CorrelationId = HttpContext.TraceIdentifier },
                "Token booked successfully."
            );

            return Ok(response);
        }
        catch (AppException)
        {
            // Let the global ExceptionMiddleware handle AppException subclasses
            // (DuplicateBookingException → 409, CenterFullException → 409, DataAccessException → 500, etc.)
            throw;
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "BookToken: resource not found for user {UserId}", userId);
            return NotFound(new ErrorResponse("RESOURCE_NOT_FOUND", ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "BookToken: conflict for user {UserId}", userId);
            return Conflict(new ErrorResponse("BOOKING_CONFLICT", ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "BookToken: unexpected error for user {UserId}", userId);
            return StatusCode(500, new ErrorResponse("INTERNAL_ERROR",
                "An error occurred while booking your token. Please try again later."));
        }
    }

    [HttpGet("my-bookings")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AppointmentResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetMyAppointments()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            _logger.LogWarning("GetMyAppointments: missing or invalid NameIdentifier claim");
            return Unauthorized(new ErrorResponse("INVALID_TOKEN", "Invalid user token."));
        }

        var appointments = await _appointmentService.GetUserAppointmentsAsync(userId);
        var list = appointments.ToList();

        var response = new ApiResponse<IEnumerable<AppointmentResponseDto>>(
            list,
            new ResponseMetadata
            {
                TotalCount    = list.Count,
                CorrelationId = HttpContext.TraceIdentifier
            },
            $"Retrieved {list.Count} appointment(s)."
        );

        return Ok(response);
    }
}
