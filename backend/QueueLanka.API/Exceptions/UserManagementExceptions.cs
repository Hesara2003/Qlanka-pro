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

/// <summary>Thrown when a supplied user ID is not a positive integer (e.g. 0 or negative).</summary>
public class InvalidUserIdException : AppException
{
    public InvalidUserIdException(int userId)
        : base(400, "INVALID_USER_ID", $"User ID must be a positive integer. Received: {userId}.") { }
}

/// <summary>Thrown when the role query-parameter value is not one of the allowed role names.</summary>
public class InvalidUserRoleFilterException : AppException
{
    public InvalidUserRoleFilterException(string role)
        : base(400, "INVALID_ROLE_FILTER",
               $"'{role}' is not a valid role. Allowed values: citizen, officer, admin.") { }
}
