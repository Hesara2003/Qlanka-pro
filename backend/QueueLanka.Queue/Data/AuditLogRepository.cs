// backend/QueueLanka.Queue/Data/AuditLogRepository.cs

using MySqlConnector;
using QueueLanka.Queue.Models;

namespace QueueLanka.Queue.Data;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly string _connectionString;
    private readonly ILogger<AuditLogRepository> _logger;

    public AuditLogRepository(IConfiguration configuration, ILogger<AuditLogRepository> logger)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");
        _logger = logger;
    }

    public async Task LogAsync(AuditLog entry)
    {
        const string sql = @"
            INSERT INTO audit_logs
                (action, entity_type, entity_id, performed_by, performed_at, details, center_id)
            VALUES
                (@Action, @EntityType, @EntityId, @PerformedBy, @PerformedAt, @Details, @CenterId)";

        try
        {
            await using var conn = new MySqlConnection(_connectionString);
            await conn.OpenAsync();

            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Action", entry.Action);
            cmd.Parameters.AddWithValue("@EntityType", entry.EntityType);
            cmd.Parameters.AddWithValue("@EntityId", entry.EntityId);
            cmd.Parameters.AddWithValue("@PerformedBy", entry.PerformedBy);
            cmd.Parameters.AddWithValue("@PerformedAt", entry.PerformedAt);
            cmd.Parameters.AddWithValue("@Details", entry.Details);
            cmd.Parameters.AddWithValue("@CenterId", entry.CenterId);

            await cmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to persist audit log for entity {EntityType}:{EntityId}", entry.EntityType, entry.EntityId);
        }
    }
}
