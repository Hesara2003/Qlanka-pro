namespace QueueLanka.Shared.Exceptions;

/// <summary>Thrown when a verification token is not found, already used, or expired.</summary>
public class InvalidVerificationTokenException : AppException
{
    public InvalidVerificationTokenException()
        : base(400, "INVALID_VERIFICATION_TOKEN",
              "The verification link is invalid or has expired. Please register again to request a new one.") { }
}
