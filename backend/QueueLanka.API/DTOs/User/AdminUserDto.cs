namespace QueueLanka.API.DTOs.User;

/// <summary>
/// Read-only representation of a user returned to the admin UI — SCRUM-78.
/// Excludes sensitive fields (password_hash etc.).
/// </summary>
public class AdminUserDto
{
    public int      UserId          { get; set; }
    public string   Username        { get; set; } = string.Empty;
    public string   Email           { get; set; } = string.Empty;
    public string   Role            { get; set; } = string.Empty;
    public int?     CenterId        { get; set; }
    public bool     IsActive        { get; set; }
    public bool     IsEmailVerified { get; set; }
    public bool     IsDeleted       { get; set; }
    public DateTime CreatedAt       { get; set; }
    public DateTime? UpdatedAt      { get; set; }
    public DateTime? LastLoginAt    { get; set; }
}
