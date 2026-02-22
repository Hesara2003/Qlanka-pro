namespace QueueLanka.API.Exceptions;

/// <summary>Thrown when a password reset token is not found, already used, or expired.</summary>
public class InvalidPasswordResetTokenException : AppException
{
    public InvalidPasswordResetTokenException()
        : base(400, "INVALID_RESET_TOKEN",
              "The password reset link is invalid or has expired. Please request a new one.") { }
}
