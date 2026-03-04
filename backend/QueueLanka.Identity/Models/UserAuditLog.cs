namespace QueueLanka.Identity.Models;

/// <summary>
/// Immutable audit record for a user-account event.
/// Maps to the user_audit_log table introduced in SCRUM-76.
/// </summary>
public class UserAuditLog
{
    public int      LogId        { get; set; }
    public int      UserId       { get; set; }

    /// <summary>Must be one of the ENUM values defined in the DB: CREATED, UPDATED, etc.</summary>
    public string   Action       { get; set; } = string.Empty;

    /// <summary>UserId of the admin/system that triggered the event. NULL = user themselves.</summary>
    public int?     PerformedBy  { get; set; }

    /// <summary>JSON snapshot of the row state before the change (optional).</summary>
    public string?  OldValues    { get; set; }

    /// <summary>JSON snapshot of the row state after the change (optional).</summary>
    public string?  NewValues    { get; set; }

    /// <summary>Free-text context: reason for deletion, originating IP, etc.</summary>
    public string?  Notes        { get; set; }

    public DateTime PerformedAt  { get; set; }
}

/// <summary>
/// Strongly-typed constants for all valid audit action values.
/// Keeps application code in sync with the DB ENUM without stringly-typed strings.
/// </summary>
public static class AuditAction
{
    public const string Created     = "CREATED";
    public const string Updated     = "UPDATED";
    public const string RoleChanged = "ROLE_CHANGED";
    public const string Activated   = "ACTIVATED";
    public const string Deactivated = "DEACTIVATED";
    public const string Deleted     = "DELETED";
    public const string Restored    = "RESTORED";
    public const string Login       = "LOGIN";
}
