namespace QueueLanka.Shared.Exceptions;

public class AccountDisabledException : AppException
{
    public AccountDisabledException()
        : base(403, "ACCOUNT_DISABLED", "This account has been deactivated.") { }
}
