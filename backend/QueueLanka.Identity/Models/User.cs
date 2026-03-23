namespace QueueLanka.Identity.Models;

/// <summary>
/// Domain model for a QueueLanka user account.
/// Updated in SCRUM-76 to support soft-delete and full auditability.
/// </summary>
public class User
{
    public int      UserId          { get; set; }
    public string   Username        { get; set; } = string.Empty;
    public string   Email           { get; set; } = string.Empty;
    public string   PasswordHash    { get; set; } = string.Empty;
    public string   Role            { get; set; } = string.Empty;
    public int?     CenterId        { get; set; }
    public bool     IsActive        { get; set; } = true;
    public bool     IsEmailVerified { get; set; } = false;
    public DateTime CreatedAt       { get; set; }

    // ── Auditability (SCRUM-76) ───────────────────────────────────────────────

    /// <summary>Last time any column on this row was modified (NULL = never changed).</summary>
    public DateTime? UpdatedAt    { get; set; }

    /// <summary>
    /// Timestamp of soft-deletion. NULL means the account is not deleted.
    /// Application layer must honour this; hard deletes should be avoided.
    /// </summary>
    public DateTime? DeletedAt    { get; set; }

    /// <summary>
    /// UserId of the admin who performed the soft-delete (NULL = system / self-service).
    /// </summary>
    public int?      DeletedBy    { get; set; }

    /// <summary>Timestamp of the user's last successful login.</summary>
    public DateTime? LastLoginAt  { get; set; }

    // ── Computed helpers ─────────────────────────────────────────────────────

    /// <summary>True if the account has been soft-deleted.</summary>
    public bool IsDeleted => DeletedAt.HasValue;
}
