namespace QueueLanka.Shared.Exceptions;

public class DuplicateUsernameException : AppException
{
    public DuplicateUsernameException(string username)
        : base(409, "USERNAME_TAKEN", $"Username '{username}' is already registered.") { }
}
