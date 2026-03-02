namespace QueueLanka.API.Exceptions;

/// <summary>Thrown when a user is not found or is already deleted.</summary>
public class UserNotFoundException : AppException
{
    public UserNotFoundException(int userId)
        : base(404, "USER_NOT_FOUND", $"User with ID {userId} was not found.") { }
}

/// <summary>Thrown when an admin account is targeted for deletion.</summary>
public class CannotDeleteAdminException : AppException
{
    public CannotDeleteAdminException()
        : base(403, "CANNOT_DELETE_ADMIN", "Admin accounts cannot be deleted.") { }
}
