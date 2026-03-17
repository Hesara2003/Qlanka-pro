
namespace QueueLanka.Shared.Events;

public class TokenCancelledEvent
{
    public int UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string TokenNumber { get; set; } = string.Empty;
    public string CenterName { get; set; } = string.Empty;
}

