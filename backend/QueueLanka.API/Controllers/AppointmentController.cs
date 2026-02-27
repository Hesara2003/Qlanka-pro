using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QueueLanka.API.DTOs.Appointment;
using QueueLanka.API.Services;
using System.Security.Claims;

namespace QueueLanka.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpPost("book")]
    public async Task<IActionResult> BookToken([FromBody] BookAppointmentRequestDto requestDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new { message = "Invalid user token." });
        }

        try
        {
            var response = await _appointmentService.BookTokenAsync(userId, requestDto);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // Indicates conflict or logic failure (Double booking, Closed date, Past time)
            return Conflict(new { message = ex.Message });
        }
        catch (Exception)
        {
            // Log real server error here
            return StatusCode(500, new { message = "An error occurred while booking your token. Please try again later." });
        }
    }

    [HttpGet("my-bookings")]
    public async Task<IActionResult> GetMyAppointments()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new { message = "Invalid user token." });
        }

        var appointments = await _appointmentService.GetUserAppointmentsAsync(userId);
        return Ok(appointments);
    }
}
