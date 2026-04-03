using System.ComponentModel.DataAnnotations;

namespace QueueLanka.ServiceCenter.DTOs.ServiceCenter;

/// <summary>
/// Request payload used by admin to enable/disable a center.
/// </summary>
public class UpdateCenterStatusRequestDto
{
    /// <summary>
    /// True to enable/open the center, false to disable/close it.
    /// </summary>
    [Required(ErrorMessage = "IsActive is required.")]
    public bool IsActive { get; set; }

    /// <summary>
    /// Optional reason for audit/debug logs.
    /// </summary>
    [StringLength(250, ErrorMessage = "Reason must not exceed 250 characters.")]
    public string? Reason { get; set; }
}
