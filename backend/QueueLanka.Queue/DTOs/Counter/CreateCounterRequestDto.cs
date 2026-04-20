// backend/QueueLanka.Queue/DTOs/Counter/CreateCounterRequestDto.cs

using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.DTOs.Counter;

public class CreateCounterRequestDto
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "CenterId must be greater than 0.")]
    public int CenterId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "AssignedOfficerUserId must be greater than 0.")]
    public int? AssignedOfficerUserId { get; set; }
}
