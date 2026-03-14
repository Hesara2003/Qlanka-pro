namespace QueueLanka.API.DTOs.Token;

public class UserTokenResponseDto
{
    public int TokenId { get; set; }
    public int CenterId { get; set; }
    public string CenterName { get; set; } = string.Empty;
    public string TokenNumber { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime IssuedTime { get; set; }
    public DateTime? EstimatedServiceTime { get; set; }
    public DateTime? ServedTime { get; set; }
    public DateTime? CompletedTime { get; set; }
    public int? QueuePosition { get; set; }
    public DateTime? ETA { get; set; }
}
