// QueueLanka.Queue/Data/CounterRepository.cs

using MySqlConnector;
using QueueLanka.Queue.Models;

namespace QueueLanka.Queue.Data;

public class CounterRepository : ICounterRepository
{
    private readonly string _connectionString;

    public CounterRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");
    }

    /// <inheritdoc/>
    public async Task<Token?> CallNextTokenAsync(int counterId)
    {
        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var transaction = await conn.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable);

        try
        {
            // Step 1: Lock the earliest waiting token for this counter (FIFO by token_number).
            // SELECT … FOR UPDATE prevents a concurrent transaction from claiming the same row.
            const string selectSql = @"
                SELECT t.token_id, t.center_id, t.user_id, t.appointment_id,
                       t.token_number, t.issued_date, t.status,
                       t.issued_time, t.estimated_service_time, t.served_time,
                       t.completed_time, t.cancelled_at, t.created_at, t.updated_at,
                       t.queue_position
                FROM tokens t
                INNER JOIN counters c ON c.center_id = t.center_id
                WHERE c.counter_id = @CounterId
                  AND t.issued_date = CURDATE()
                  AND t.status = 'Waiting'
                ORDER BY t.token_number ASC
                LIMIT 1
                FOR UPDATE";

            Token? token = null;

            await using (var selectCmd = new MySqlCommand(selectSql, conn, transaction))
            {
                selectCmd.Parameters.AddWithValue("@CounterId", counterId);

                await using var reader = await selectCmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    token = MapToken((MySqlDataReader)reader);
                }
            }

            if (token == null)
            {
                await transaction.CommitAsync();
                return null;
            }

            // Step 2: Atomically update the locked row to 'Called'.
            const string updateSql = @"
                UPDATE tokens
                SET status     = 'Called',
                    called_at  = UTC_TIMESTAMP(),
                    updated_at = UTC_TIMESTAMP()
                WHERE token_id = @TokenId
                  AND status   = 'Waiting'";

            await using (var updateCmd = new MySqlCommand(updateSql, conn, transaction))
            {
                updateCmd.Parameters.AddWithValue("@TokenId", token.TokenId);
                var affected = await updateCmd.ExecuteNonQueryAsync();

                // If another concurrent transaction already claimed this token the
                // affected count will be 0 — roll back and surface null so the caller
                // can return 404, forcing the officer to retry.
                if (affected == 0)
                {
                    await transaction.RollbackAsync();
                    return null;
                }
            }

            await transaction.CommitAsync();

            // Refresh the timestamp fields to what the DB actually wrote.
            token.Status    = "Called";
            token.CalledAt  = DateTime.UtcNow;
            token.UpdatedAt = DateTime.UtcNow;

            return token;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> IsCounterOpenAsync(int counterId)
    {
        const string sql = @"
            SELECT COUNT(1)
            FROM counters
            WHERE counter_id = @CounterId
              AND status = 'Open'
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CounterId", counterId);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result) > 0;
    }

    // ─────────────────────── private helpers ───────────────────────

    private static Token MapToken(MySqlDataReader reader)
    {
        return new Token
        {
            TokenId              = reader.GetInt32(reader.GetOrdinal("token_id")),
            CenterId             = reader.GetInt32(reader.GetOrdinal("center_id")),
            UserId               = reader.IsDBNull(reader.GetOrdinal("user_id"))               ? null : reader.GetInt32(reader.GetOrdinal("user_id")),
            AppointmentId        = reader.IsDBNull(reader.GetOrdinal("appointment_id"))        ? null : reader.GetInt32(reader.GetOrdinal("appointment_id")),
            TokenNumber          = reader.GetString(reader.GetOrdinal("token_number")),
            IssuedDate           = reader.GetDateTime(reader.GetOrdinal("issued_date")),
            Status               = reader.GetString(reader.GetOrdinal("status")),
            IssuedTime           = reader.GetDateTime(reader.GetOrdinal("issued_time")),
            EstimatedServiceTime = reader.IsDBNull(reader.GetOrdinal("estimated_service_time")) ? null : reader.GetDateTime(reader.GetOrdinal("estimated_service_time")),
            ServedTime           = reader.IsDBNull(reader.GetOrdinal("served_time"))            ? null : reader.GetDateTime(reader.GetOrdinal("served_time")),
            CompletedTime        = reader.IsDBNull(reader.GetOrdinal("completed_time"))         ? null : reader.GetDateTime(reader.GetOrdinal("completed_time")),
            CancelledAt          = reader.IsDBNull(reader.GetOrdinal("cancelled_at"))           ? null : reader.GetDateTime(reader.GetOrdinal("cancelled_at")),
            CreatedAt            = reader.GetDateTime(reader.GetOrdinal("created_at")),
            UpdatedAt            = reader.IsDBNull(reader.GetOrdinal("updated_at"))             ? null : reader.GetDateTime(reader.GetOrdinal("updated_at")),
            QueuePosition        = reader.IsDBNull(reader.GetOrdinal("queue_position"))         ? null : reader.GetInt32(reader.GetOrdinal("queue_position"))
        };
    }
}
