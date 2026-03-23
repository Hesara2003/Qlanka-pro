
namespace QueueLanka.Shared.Events;

public class UserRegisteredEvent
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string VerificationToken { get; set; } = string.Empty;
}

