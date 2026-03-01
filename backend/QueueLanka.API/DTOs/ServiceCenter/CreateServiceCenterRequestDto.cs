using System.ComponentModel.DataAnnotations;

namespace QueueLanka.API.DTOs.ServiceCenter;

/// <summary>
/// Request payload for creating a new service center — SCRUM-65.
/// All location fields (Address, Timezone) are required to ensure correct
/// linkage of the center to its physical and operational location.
/// </summary>
public class CreateServiceCenterRequestDto
{
    /// <summary>Display name of the service center.</summary>
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters.")]
    public string Name { get; set; } = string.Empty;

    /// <summary>Full physical address — used for location linkage.</summary>
    [Required(ErrorMessage = "Address is required.")]
    [StringLength(255, MinimumLength = 5, ErrorMessage = "Address must be between 5 and 255 characters.")]
    public string Address { get; set; } = string.Empty;

    [Phone(ErrorMessage = "Phone must be a valid phone number.")]
    [StringLength(20, ErrorMessage = "Phone must not exceed 20 characters.")]
    public string? Phone { get; set; }

    [EmailAddress(ErrorMessage = "Email must be a valid email address.")]
    [StringLength(100, ErrorMessage = "Email must not exceed 100 characters.")]
    public string? Email { get; set; }

    [StringLength(1000, ErrorMessage = "Description must not exceed 1 000 characters.")]
    public string? Description { get; set; }

    /// <summary>
    /// IANA timezone identifier for the center's locale (e.g. "Asia/Colombo").
    /// Used to convert local service hours to UTC for accurate ETA calculations.
    /// </summary>
    [Required(ErrorMessage = "Timezone is required.")]
    [StringLength(50, ErrorMessage = "Timezone must not exceed 50 characters.")]
    public string Timezone { get; set; } = "Asia/Colombo";

    /// <summary>Maximum number of tokens that can be issued per day.</summary>
    [Range(1, 10_000, ErrorMessage = "Capacity must be between 1 and 10 000.")]
    public int Capacity { get; set; } = 50;

    /// <summary>Average minutes required to serve one customer.</summary>
    [Range(1, 480, ErrorMessage = "Average service time must be between 1 and 480 minutes.")]
    public int AverageServiceTimeMinutes { get; set; } = 15;

    /// <summary>Local opening time in "HH:mm" format (e.g. "08:00").</summary>
    [Required(ErrorMessage = "OpeningTime is required.")]
    [RegularExpression(@"^([01]\d|2[0-3]):[0-5]\d$", ErrorMessage = "OpeningTime must be in HH:mm format.")]
    public string OpeningTime { get; set; } = "08:00";

    /// <summary>Local closing time in "HH:mm" format (e.g. "17:00").</summary>
    [Required(ErrorMessage = "ClosingTime is required.")]
    [RegularExpression(@"^([01]\d|2[0-3]):[0-5]\d$", ErrorMessage = "ClosingTime must be in HH:mm format.")]
    public string ClosingTime { get; set; } = "17:00";

    /// <summary>Whether the center should be active immediately upon creation.</summary>
    public bool IsActive { get; set; } = true;
}
