using QueueLanka.API.Data;
using QueueLanka.API.DTOs.User;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Models;

namespace QueueLanka.API.Services;

/// <summary>
/// Admin-facing operations for user listing and deletion — SCRUM-78.
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

        var users = await _userRepository.GetAllAsync(role, isActive);
        return users.Select(MapToDto);
    }

    // ── Delete ────────────────────────────────────────────────────────────

    public async Task DeleteUserAsync(int userId, int requestingAdminId)
    {
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new UserNotFoundException(userId);

        if (user.IsDeleted)
            throw new UserNotFoundException(userId);

        if (string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase))
            throw new CannotDeleteAdminException();

        _logger.LogInformation(
            "Admin {AdminId} soft-deleting user {UserId} (role: {Role})",
            requestingAdminId, userId, user.Role);

        await _userRepository.SoftDeleteAsync(userId, requestingAdminId);

        // Append audit log entry
        await _userRepository.AddAuditLogAsync(new UserAuditLog
        {
            UserId    = userId,
            ChangedBy = requestingAdminId,
            ChangeType = "DELETE",
            Notes     = "Soft-deleted by admin via Admin Users panel (SCRUM-78)"
        });
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
