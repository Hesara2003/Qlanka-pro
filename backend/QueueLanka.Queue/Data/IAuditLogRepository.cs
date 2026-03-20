// backend/QueueLanka.Queue/Data/IAuditLogRepository.cs

using QueueLanka.Queue.Models;

namespace QueueLanka.Queue.Data;

public interface IAuditLogRepository
{
    Task LogAsync(AuditLog entry);
}
