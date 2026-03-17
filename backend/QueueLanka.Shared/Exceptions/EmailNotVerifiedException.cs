namespace QueueLanka.Shared.Exceptions;

/// <summary>Thrown when a user tries to log in before verifying their email.</summary>
public class EmailNotVerifiedException : AppException
{
    public EmailNotVerifiedException()
        : base(403, "EMAIL_NOT_VERIFIED",
              "Your email address has not been verified. Please check your inbox for the verification link.") { }
}
