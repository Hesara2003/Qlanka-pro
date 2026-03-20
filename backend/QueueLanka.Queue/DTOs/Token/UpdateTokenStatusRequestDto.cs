// backend/QueueLanka.Queue/DTOs/Token/UpdateTokenStatusRequestDto.cs

using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.DTOs.Token;

public class UpdateTokenStatusRequestDto
{
    [Required(ErrorMessage = "Status is required.")]
    [RegularExpression("^(served|skipped)$", ErrorMessage = "Status must be either 'served' or 'skipped'.")]
    public string Status { get; set; } = string.Empty;
}