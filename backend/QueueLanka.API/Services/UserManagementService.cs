using QueueLanka.API.Data;
using QueueLanka.API.DTOs.User;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Models;

namespace QueueLanka.API.Services;

/// <summary>
/// Admin-facing operations for user listing and deletion — SCRUM-78/83.
/// </summary>
public class UserManagementService : IUserManagementService
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UserManagementService> _logger;

    public UserManagementService(
        IUserRepository userRepository,
        ILogger<UserManagementService> logger)
    {
        _userRepository = userRepository;
        _logger         = logger;
    }

    // ── List ──────────────────────────────────────────────────────────────

    public async Task<IEnumerable<AdminUserDto>> GetUsersAsync(
        string? role = null,
        bool?   isActive = null)
    {
        _logger.LogInformation(
            "Admin listing users — role filter: {Role}, active filter: {IsActive}",
            role ?? "none",
            isActive.HasValue ? isActive.Value.ToString() : "none");

        try
        {
            var users = await _userRepository.GetAllAsync(role, isActive);
            return users.Select(MapToDto);
        }
        catch (Exception ex) when (ex is not AppException)
        {
            _logger.LogError(ex, "Data access error while listing users");
            throw new DataAccessException("Failed to retrieve users. Please try again.");
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────

    public async Task DeleteUserAsync(int userId, int requestingAdminId)
    {
        User user;
        try
        {
            user = await _userRepository.GetByIdAsync(userId)
                ?? throw new UserNotFoundException(userId);
        }
        catch (Exception ex) when (ex is not AppException)
        {
            _logger.LogError(ex, "Data access error while fetching user {UserId} for deletion", userId);
            throw new DataAccessException("Failed to retrieve user. Please try again.");
        }

        if (user.IsDeleted)
            throw new UserNotFoundException(userId);

        if (string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase))
            throw new CannotDeleteAdminException();

        _logger.LogInformation(
            "Admin {AdminId} soft-deleting user {UserId} (role: {Role})",
            requestingAdminId, userId, user.Role);

        try
        {
            await _userRepository.SoftDeleteAsync(userId, requestingAdminId);

            await _userRepository.AddAuditLogAsync(new UserAuditLog
            {
                UserId      = userId,
                PerformedBy = requestingAdminId,
                Action      = AuditAction.Deleted,
                Notes       = "Soft-deleted by admin via Admin Users panel (SCRUM-78)"
            });
        }
        catch (Exception ex) when (ex is not AppException)
        {
            _logger.LogError(ex, "Data access error while deleting user {UserId}", userId);
            throw new DataAccessException("Failed to delete user. Please try again.");
        }
    }

    // ── Mapping ───────────────────────────────────────────────────────────

    private static AdminUserDto MapToDto(User u) => new()
    {
        UserId          = u.UserId,
        Username        = u.Username,
        Email           = u.Email,
        Role            = u.Role,
        CenterId        = u.CenterId,
        IsActive        = u.IsActive,
        IsEmailVerified = u.IsEmailVerified,
        IsDeleted       = u.IsDeleted,
        CreatedAt       = u.CreatedAt,
        UpdatedAt       = u.UpdatedAt,
        LastLoginAt     = u.LastLoginAt,
    };
}
