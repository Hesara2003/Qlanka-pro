using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public interface IUserRepository
{
    // ── Lookups ────────────────────────────────────────────────────────────
    Task<User?> GetByIdAsync(int userId);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);

    // ── Listing (SCRUM-76) ─────────────────────────────────────────────────
    /// <summary>Return all non-deleted users, optionally filtered by role and/or active status.</summary>
    Task<IEnumerable<User>> GetAllAsync(string? role = null, bool? isActive = null);

    // ── Writes ─────────────────────────────────────────────────────────────
    Task<int> CreateAsync(User user);
    Task SetEmailVerifiedAsync(int userId);

    // ── Auditability / soft-delete (SCRUM-76) ──────────────────────────────
    /// <summary>Record the timestamp of a successful login.</summary>
    Task UpdateLastLoginAsync(int userId);

    /// <summary>
    /// Soft-delete a user: stamps deleted_at, deleted_by, and sets is_active = FALSE.
    /// Does NOT hard-delete — referential integrity to appointments/tokens is preserved.
    /// </summary>
    Task SoftDeleteAsync(int userId, int? deletedBy);

    /// <summary>Reverse a soft-delete: clears deleted_at/deleted_by and sets is_active = TRUE.</summary>
    Task RestoreAsync(int userId);

    /// <summary>Change is_active without touching deleted_at (enable/disable without deleting).</summary>
    Task SetActiveAsync(int userId, bool isActive);

    /// <summary>Append one row to user_audit_log.</summary>
    Task AddAuditLogAsync(UserAuditLog entry);
}
