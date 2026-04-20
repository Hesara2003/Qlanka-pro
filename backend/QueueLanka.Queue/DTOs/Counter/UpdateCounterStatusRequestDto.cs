// backend/QueueLanka.Queue/DTOs/Counter/UpdateCounterStatusRequestDto.cs

using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.DTOs.Counter;

public class UpdateCounterStatusRequestDto
{
    [Required(ErrorMessage = "IsOpen is required.")]
    public bool? IsOpen { get; set; }

    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters.")]
    public string? Reason { get; set; }
}
