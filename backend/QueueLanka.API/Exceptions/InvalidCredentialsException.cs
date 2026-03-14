namespace QueueLanka.API.Exceptions;

public class InvalidCredentialsException : AppException
{
    public InvalidCredentialsException()
        : base(401, "INVALID_CREDENTIALS", "Invalid username or password.") { }
}
