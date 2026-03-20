// backend/QueueLanka.Queue/DTOs/Token/ReassignTokenResponseDto.cs

namespace QueueLanka.Queue.DTOs.Token;

public class ReassignTokenResponseDto
{
    public int TokenId { get; set; }
    public int CenterId { get; set; }
    public int? UserId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public DateTime IssuedTime { get; set; }
    public int? QueuePosition { get; set; }
    public int SourceCounterId { get; set; }
    public int TargetCounterId { get; set; }
    public DateTime ReassignedAt { get; set; }
}