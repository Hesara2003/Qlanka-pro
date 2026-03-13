using QueueLanka.Identity.DTOs.User;

namespace QueueLanka.Identity.Services;

/// <summary>
/// Admin-facing operations for user listing and deletion — SCRUM-78.
/// </summary>
public interface IUserManagementService
{
    /// <summary>
    /// Returns all non-deleted users, optionally filtered by role and/or active status.
    /// </summary>
    Task<IEnumerable<AdminUserDto>> GetUsersAsync(string? role = null, bool? isActive = null);

    /// <summary>
    /// Soft-deletes the user identified by <paramref name="userId"/>.
    /// Throws <see cref="QueueLanka.Shared.Exceptions.UserNotFoundException"/> when the user
    /// does not exist or is already deleted.
    /// Throws <see cref="QueueLanka.Shared.Exceptions.CannotDeleteAdminException"/> when the
    /// caller attempts to delete an admin account.
    /// </summary>
    Task DeleteUserAsync(int userId, int requestingAdminId);
}
