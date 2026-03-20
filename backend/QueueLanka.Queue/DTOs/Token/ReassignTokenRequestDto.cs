// backend/QueueLanka.Queue/DTOs/Token/ReassignTokenRequestDto.cs

using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.DTOs.Token;

public class ReassignTokenRequestDto
{
    [Required(ErrorMessage = "TokenId is required.")]
    public int TokenId { get; set; }

    [Required(ErrorMessage = "TargetCounterId is required.")]
    public int TargetCounterId { get; set; }

    public string? Reason { get; set; }
}