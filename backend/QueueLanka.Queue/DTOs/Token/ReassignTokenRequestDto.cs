// backend/QueueLanka.Queue/DTOs/Token/ReassignTokenRequestDto.cs

using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.DTOs.Token;

public class ReassignTokenRequestDto
{
    [Range(1, int.MaxValue, ErrorMessage = "TokenId must be greater than zero.")]
    public int TokenId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "TargetCounterId must be greater than zero.")]
    public int TargetCounterId { get; set; }

    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters.")]
    public string? Reason { get; set; }
}