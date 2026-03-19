// backend/QueueLanka.Queue/Models/AuditLog.cs

namespace QueueLanka.Queue.Models;

public class AuditLog
{
    public int AuditLogId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public int PerformedBy { get; set; }
    public DateTime PerformedAt { get; set; }
    public string Details { get; set; } = string.Empty;
    public int CenterId { get; set; }
}
