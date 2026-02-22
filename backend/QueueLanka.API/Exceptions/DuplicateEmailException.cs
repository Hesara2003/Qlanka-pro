namespace QueueLanka.API.Exceptions;

public class DuplicateEmailException : AppException
{
    public DuplicateEmailException(string email)
        : base(409, "EMAIL_TAKEN", $"Email '{email}' is already registered.") { }
}
