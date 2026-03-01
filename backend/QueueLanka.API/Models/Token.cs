namespace QueueLanka.API.Models;

public class Token
{
    public int TokenId { get; set; }
    public int CenterId { get; set; }
    public int? UserId { get; set; }
    public int? AppointmentId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public string Status { get; set; } = "Waiting";
    public DateTime IssuedTime { get; set; }
    public DateTime? EstimatedServiceTime { get; set; }
    public DateTime? ServedTime { get; set; }
    public DateTime? CompletedTime { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? QueuePosition { get; set; }
}
