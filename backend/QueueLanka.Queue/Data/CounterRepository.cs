// backend/QueueLanka.Queue/Data/CounterRepository.cs

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
                      t.completed_time, t.cancelled_at, t.called_at,
                      t.created_at, t.updated_at,
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
    public async Task<(Token Token, int CounterId, int? NextTokenId)> UpdateTokenStatusAsync(int counterId, int tokenId, string status)
    {
        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var transaction = await conn.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable);

        try
        {
            const string selectCounterSql = @"
                SELECT c.counter_id, c.center_id
                FROM counters c
                WHERE c.counter_id = @CounterId
                LIMIT 1
                FOR UPDATE";

            int centerId;

            await using (var counterCmd = new MySqlCommand(selectCounterSql, conn, transaction))
            {
                counterCmd.Parameters.AddWithValue("@CounterId", counterId);

                await using var reader = await counterCmd.ExecuteReaderAsync();
                if (!await reader.ReadAsync())
                {
                    throw new KeyNotFoundException("Counter not found.");
                }

                centerId = reader.GetInt32(reader.GetOrdinal("center_id"));
            }

            const string selectTokenSql = @"
                SELECT t.token_id, t.center_id, t.user_id, t.appointment_id,
                       t.token_number, t.issued_date, t.status,
                       t.issued_time, t.estimated_service_time, t.served_time,
                       t.completed_time, t.cancelled_at, t.called_at,
                       t.created_at, t.updated_at, t.queue_position
                FROM tokens t
                WHERE t.token_id = @TokenId
                LIMIT 1
                FOR UPDATE";

            Token? token = null;

            await using (var tokenCmd = new MySqlCommand(selectTokenSql, conn, transaction))
            {
                tokenCmd.Parameters.AddWithValue("@TokenId", tokenId);

                await using var reader = await tokenCmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    token = MapToken((MySqlDataReader)reader);
                }
            }

            if (token == null)
            {
                throw new KeyNotFoundException("Token not found.");
            }

            if (token.CenterId != centerId)
            {
                throw new UnauthorizedAccessException("Token does not belong to this counter.");
            }

            if (!string.Equals(token.Status, "Called", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Token is not in called state.");
            }

            var isServed = string.Equals(status, "served", StringComparison.OrdinalIgnoreCase);
            var targetDbStatus = isServed ? "Completed" : "Skipped";

            const string updateTokenSql = @"
                UPDATE tokens
                SET status     = @Status,
                    served_at  = CASE WHEN @IsServed = 1 THEN UTC_TIMESTAMP() ELSE served_at END,
                    served_time = CASE WHEN @IsServed = 1 THEN UTC_TIMESTAMP() ELSE served_time END,
                    updated_at = UTC_TIMESTAMP()
                WHERE token_id = @TokenId
                  AND status   = 'Called'";

            await using (var updateTokenCmd = new MySqlCommand(updateTokenSql, conn, transaction))
            {
                updateTokenCmd.Parameters.AddWithValue("@Status", targetDbStatus);
                updateTokenCmd.Parameters.AddWithValue("@IsServed", isServed ? 1 : 0);
                updateTokenCmd.Parameters.AddWithValue("@TokenId", token.TokenId);

                var affected = await updateTokenCmd.ExecuteNonQueryAsync();
                if (affected == 0)
                {
                    throw new InvalidOperationException("Token is not in called state.");
                }
            }

            const string clearCurrentTokenSql = @"
                UPDATE counters
                SET current_token_id = NULL,
                    updated_at = UTC_TIMESTAMP()
                WHERE counter_id = @CounterId";

            await using (var clearCounterCmd = new MySqlCommand(clearCurrentTokenSql, conn, transaction))
            {
                clearCounterCmd.Parameters.AddWithValue("@CounterId", counterId);
                await clearCounterCmd.ExecuteNonQueryAsync();
            }

            const string selectNextWaitingSql = @"
                SELECT t.token_id
                FROM tokens t
                INNER JOIN counters c ON c.center_id = t.center_id
                WHERE c.counter_id = @CounterId
                  AND t.issued_date = CURDATE()
                  AND t.status = 'Waiting'
                ORDER BY t.token_number ASC
                LIMIT 1
                FOR UPDATE";

            int? nextTokenId = null;

            await using (var selectNextCmd = new MySqlCommand(selectNextWaitingSql, conn, transaction))
            {
                selectNextCmd.Parameters.AddWithValue("@CounterId", counterId);

                var scalar = await selectNextCmd.ExecuteScalarAsync();
                if (scalar != null && scalar != DBNull.Value)
                {
                    nextTokenId = Convert.ToInt32(scalar);
                }
            }

            if (nextTokenId.HasValue)
            {
                const string setNextCurrentSql = @"
                    UPDATE counters
                    SET current_token_id = @NextTokenId,
                        updated_at = UTC_TIMESTAMP()
                    WHERE counter_id = @CounterId";

                await using var setNextCmd = new MySqlCommand(setNextCurrentSql, conn, transaction);
                setNextCmd.Parameters.AddWithValue("@CounterId", counterId);
                setNextCmd.Parameters.AddWithValue("@NextTokenId", nextTokenId.Value);
                await setNextCmd.ExecuteNonQueryAsync();
            }

            await transaction.CommitAsync();

            token.Status = targetDbStatus;
            token.UpdatedAt = DateTime.UtcNow;
            if (isServed)
            {
                token.ServedTime = DateTime.UtcNow;
            }

            return (token, counterId, nextTokenId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<(Token Token, int SourceCounterId, int TargetCounterId, DateTime ReassignedAt)> ReassignTokenAsync(
        int tokenId,
        int sourceCounterId,
        int targetCounterId)
    {
        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var transaction = await conn.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable);

        try
        {
            const string selectSourceCounterSql = @"
                SELECT c.counter_id, c.center_id, c.current_token_id
                FROM counters c
                WHERE c.counter_id = @SourceCounterId
                LIMIT 1
                FOR UPDATE";

            int sourceCenterId;
            int? sourceCurrentTokenId;

            await using (var sourceCmd = new MySqlCommand(selectSourceCounterSql, conn, transaction))
            {
                sourceCmd.Parameters.AddWithValue("@SourceCounterId", sourceCounterId);

                await using var reader = await sourceCmd.ExecuteReaderAsync();
                if (!await reader.ReadAsync())
                {
                    throw new KeyNotFoundException("Source counter not found.");
                }

                sourceCenterId = reader.GetInt32(reader.GetOrdinal("center_id"));
                sourceCurrentTokenId = reader.IsDBNull(reader.GetOrdinal("current_token_id"))
                    ? null
                    : reader.GetInt32(reader.GetOrdinal("current_token_id"));
            }

            const string selectTargetCounterSql = @"
                SELECT c.counter_id, c.center_id, c.status
                FROM counters c
                WHERE c.counter_id = @TargetCounterId
                LIMIT 1
                FOR UPDATE";

            int targetCenterId;
            string targetStatus;

            await using (var targetCmd = new MySqlCommand(selectTargetCounterSql, conn, transaction))
            {
                targetCmd.Parameters.AddWithValue("@TargetCounterId", targetCounterId);

                await using var reader = await targetCmd.ExecuteReaderAsync();
                if (!await reader.ReadAsync())
                {
                    throw new KeyNotFoundException("Target counter not found.");
                }

                targetCenterId = reader.GetInt32(reader.GetOrdinal("center_id"));
                targetStatus = reader.GetString(reader.GetOrdinal("status"));
            }

            if (!string.Equals(targetStatus, "Open", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Target counter is closed.");
            }

            if (sourceCenterId != targetCenterId)
            {
                throw new InvalidOperationException("Source and target counters belong to different centers.");
            }

            const string selectTokenSql = @"
                SELECT t.token_id, t.center_id, t.user_id, t.appointment_id,
                       t.token_number, t.issued_date, t.status,
                       t.issued_time, t.estimated_service_time, t.served_time,
                       t.completed_time, t.cancelled_at, t.called_at,
                       t.created_at, t.updated_at, t.queue_position,
                       t.counter_id
                FROM tokens t
                WHERE t.token_id = @TokenId
                LIMIT 1
                FOR UPDATE";

            Token? token = null;
            int? tokenCounterId = null;

            await using (var tokenCmd = new MySqlCommand(selectTokenSql, conn, transaction))
            {
                tokenCmd.Parameters.AddWithValue("@TokenId", tokenId);

                await using var reader = await tokenCmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    token = MapToken((MySqlDataReader)reader);
                    tokenCounterId = reader.IsDBNull(reader.GetOrdinal("counter_id"))
                        ? null
                        : reader.GetInt32(reader.GetOrdinal("counter_id"));
                }
            }

            if (token == null)
            {
                throw new KeyNotFoundException("Token not found.");
            }

            if (token.CenterId != sourceCenterId)
            {
                throw new UnauthorizedAccessException("Token does not belong to source counter.");
            }

            if (!tokenCounterId.HasValue || tokenCounterId.Value != sourceCounterId)
            {
                throw new UnauthorizedAccessException("Token does not belong to source counter.");
            }

            var status = token.Status.Trim();
            if (string.Equals(status, "Served", StringComparison.OrdinalIgnoreCase)
                || string.Equals(status, "Skipped", StringComparison.OrdinalIgnoreCase)
                || string.Equals(status, "Completed", StringComparison.OrdinalIgnoreCase)
                || string.Equals(status, "Cancelled", StringComparison.OrdinalIgnoreCase)
                || string.Equals(status, "NoShow", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Token cannot be reassigned in its current state.");
            }

            const string updateTokenCounterSql = @"
                UPDATE tokens
                SET counter_id = @TargetCounterId,
                    updated_at = UTC_TIMESTAMP()
                WHERE token_id = @TokenId";

            await using (var updateTokenCounterCmd = new MySqlCommand(updateTokenCounterSql, conn, transaction))
            {
                updateTokenCounterCmd.Parameters.AddWithValue("@TargetCounterId", targetCounterId);
                updateTokenCounterCmd.Parameters.AddWithValue("@TokenId", tokenId);
                await updateTokenCounterCmd.ExecuteNonQueryAsync();
            }

            if (sourceCurrentTokenId.HasValue && sourceCurrentTokenId.Value == tokenId)
            {
                const string clearSourceCurrentSql = @"
                    UPDATE counters
                    SET current_token_id = NULL,
                        updated_at = UTC_TIMESTAMP()
                    WHERE counter_id = @SourceCounterId";

                await using var clearSourceCmd = new MySqlCommand(clearSourceCurrentSql, conn, transaction);
                clearSourceCmd.Parameters.AddWithValue("@SourceCounterId", sourceCounterId);
                await clearSourceCmd.ExecuteNonQueryAsync();
            }

            const string recalculateSourceQueueSql = @"
                UPDATE tokens t
                JOIN (
                    SELECT x.token_id,
                           ROW_NUMBER() OVER (
                               ORDER BY
                                   CASE WHEN x.queue_position IS NULL THEN 1 ELSE 0 END,
                                   x.queue_position ASC,
                                   x.token_number ASC
                           ) AS new_queue_position
                    FROM tokens x
                    WHERE x.counter_id = @SourceCounterId
                      AND x.issued_date = CURDATE()
                      AND x.status IN ('Waiting', 'Called')
                ) q ON q.token_id = t.token_id
                SET t.queue_position = q.new_queue_position,
                    t.updated_at = UTC_TIMESTAMP()";

            await using (var recalculateSourceCmd = new MySqlCommand(recalculateSourceQueueSql, conn, transaction))
            {
                recalculateSourceCmd.Parameters.AddWithValue("@SourceCounterId", sourceCounterId);
                await recalculateSourceCmd.ExecuteNonQueryAsync();
            }

            const string recalculateTargetQueueSql = @"
                UPDATE tokens t
                JOIN (
                    SELECT x.token_id,
                           ROW_NUMBER() OVER (
                               ORDER BY
                                   CASE WHEN x.queue_position IS NULL THEN 1 ELSE 0 END,
                                   x.queue_position ASC,
                                   x.token_number ASC
                           ) AS new_queue_position
                    FROM tokens x
                    WHERE x.counter_id = @TargetCounterId
                      AND x.issued_date = CURDATE()
                      AND x.status IN ('Waiting', 'Called')
                ) q ON q.token_id = t.token_id
                SET t.queue_position = q.new_queue_position,
                    t.updated_at = UTC_TIMESTAMP()";

            await using (var recalculateTargetCmd = new MySqlCommand(recalculateTargetQueueSql, conn, transaction))
            {
                recalculateTargetCmd.Parameters.AddWithValue("@TargetCounterId", targetCounterId);
                await recalculateTargetCmd.ExecuteNonQueryAsync();
            }

            const string selectUpdatedTokenSql = @"
                SELECT t.token_id, t.center_id, t.user_id, t.appointment_id,
                       t.token_number, t.issued_date, t.status,
                       t.issued_time, t.estimated_service_time, t.served_time,
                       t.completed_time, t.cancelled_at, t.called_at,
                       t.created_at, t.updated_at, t.queue_position
                FROM tokens t
                WHERE t.token_id = @TokenId
                LIMIT 1";

            Token updatedToken;
            await using (var selectUpdatedCmd = new MySqlCommand(selectUpdatedTokenSql, conn, transaction))
            {
                selectUpdatedCmd.Parameters.AddWithValue("@TokenId", tokenId);

                await using var reader = await selectUpdatedCmd.ExecuteReaderAsync();
                if (!await reader.ReadAsync())
                {
                    throw new KeyNotFoundException("Token not found after reassignment.");
                }

                updatedToken = MapToken((MySqlDataReader)reader);
            }

            await transaction.CommitAsync();

            return (updatedToken, sourceCounterId, targetCounterId, DateTime.UtcNow);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<(int CounterId, string CounterName, bool IsOpen, int? AssignedOfficerUserId, Token? CurrentToken)?>
        GetCounterDashboardAsync(int counterId)
    {
        const string sql = @"
            SELECT c.counter_id,
                   c.name,
                   c.status,
                   c.assigned_officer_id,
                   t.token_id,
                   t.center_id,
                   t.user_id,
                   t.appointment_id,
                   t.token_number,
                   t.issued_date,
                   t.status AS token_status,
                   t.issued_time,
                   t.estimated_service_time,
                   t.served_time,
                   t.completed_time,
                   t.cancelled_at,
                   t.called_at,
                   t.created_at,
                   t.updated_at,
                   t.queue_position
            FROM counters c
            LEFT JOIN tokens t ON t.token_id = c.current_token_id
            WHERE c.counter_id = @CounterId
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CounterId", counterId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return null;
        }

        var status = reader.GetString(reader.GetOrdinal("status"));
        var isOpen = string.Equals(status, "Open", StringComparison.OrdinalIgnoreCase);

        int? assignedOfficerUserId = reader.IsDBNull(reader.GetOrdinal("assigned_officer_id"))
            ? (int?)null
            : reader.GetInt32(reader.GetOrdinal("assigned_officer_id"));

        Token? currentToken = null;
        if (!reader.IsDBNull(reader.GetOrdinal("token_id")))
        {
            currentToken = new Token
            {
                TokenId = reader.GetInt32(reader.GetOrdinal("token_id")),
                CenterId = reader.GetInt32(reader.GetOrdinal("center_id")),
                UserId = reader.IsDBNull(reader.GetOrdinal("user_id")) ? null : reader.GetInt32(reader.GetOrdinal("user_id")),
                AppointmentId = reader.IsDBNull(reader.GetOrdinal("appointment_id")) ? null : reader.GetInt32(reader.GetOrdinal("appointment_id")),
                TokenNumber = reader.GetString(reader.GetOrdinal("token_number")),
                IssuedDate = reader.GetDateTime(reader.GetOrdinal("issued_date")),
                Status = reader.GetString(reader.GetOrdinal("token_status")),
                IssuedTime = reader.GetDateTime(reader.GetOrdinal("issued_time")),
                EstimatedServiceTime = reader.IsDBNull(reader.GetOrdinal("estimated_service_time")) ? null : reader.GetDateTime(reader.GetOrdinal("estimated_service_time")),
                ServedTime = reader.IsDBNull(reader.GetOrdinal("served_time")) ? null : reader.GetDateTime(reader.GetOrdinal("served_time")),
                CompletedTime = reader.IsDBNull(reader.GetOrdinal("completed_time")) ? null : reader.GetDateTime(reader.GetOrdinal("completed_time")),
                CancelledAt = reader.IsDBNull(reader.GetOrdinal("cancelled_at")) ? null : reader.GetDateTime(reader.GetOrdinal("cancelled_at")),
                CalledAt = reader.IsDBNull(reader.GetOrdinal("called_at")) ? null : reader.GetDateTime(reader.GetOrdinal("called_at")),
                CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at")),
                UpdatedAt = reader.IsDBNull(reader.GetOrdinal("updated_at")) ? null : reader.GetDateTime(reader.GetOrdinal("updated_at")),
                QueuePosition = reader.IsDBNull(reader.GetOrdinal("queue_position")) ? null : reader.GetInt32(reader.GetOrdinal("queue_position"))
            };
        }

        return (
            reader.GetInt32(reader.GetOrdinal("counter_id")),
            reader.GetString(reader.GetOrdinal("name")),
            isOpen,
            assignedOfficerUserId,
            currentToken);
    }

    /// <inheritdoc/>
    public async Task<IReadOnlyList<Token>> GetWaitingTokensAsync(int counterId)
    {
        const string sql = @"
            SELECT t.token_id, t.center_id, t.user_id, t.appointment_id,
                   t.token_number, t.issued_date, t.status,
                   t.issued_time, t.estimated_service_time, t.served_time,
                   t.completed_time, t.cancelled_at, t.called_at,
                   t.created_at, t.updated_at, t.queue_position
            FROM tokens t
            WHERE t.status = 'Waiting'
              AND t.counter_id = @CounterId
            ORDER BY t.number ASC";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CounterId", counterId);

        var waitingTokens = new List<Token>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            waitingTokens.Add(MapToken((MySqlDataReader)reader));
        }

        return waitingTokens;
    }

    /// <inheritdoc/>
    public async Task<int> GetServedCountTodayAsync(int counterId)
    {
        const string sql = @"
            SELECT COUNT(1)
            FROM tokens
            WHERE counter_id = @CounterId
              AND status IN ('Served', 'Completed')
              AND DATE(served_at) = CURDATE()";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CounterId", counterId);

        var result = await cmd.ExecuteScalarAsync();
        return result == null || result == DBNull.Value ? 0 : Convert.ToInt32(result);
    }

    /// <inheritdoc/>
    public async Task<int> GetSkippedCountTodayAsync(int counterId)
    {
        const string sql = @"
            SELECT COUNT(1)
            FROM tokens
            WHERE counter_id = @CounterId
              AND status = 'Skipped'
              AND DATE(COALESCE(skipped_at, updated_at)) = CURDATE()";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CounterId", counterId);

        var result = await cmd.ExecuteScalarAsync();
        return result == null || result == DBNull.Value ? 0 : Convert.ToInt32(result);
    }

    /// <inheritdoc/>
    public async Task<int> GetAverageServiceTimeAsync(int counterId)
    {
        const string sql = @"
            SELECT AVG(TIMESTAMPDIFF(SECOND, called_at, served_at))
            FROM tokens
            WHERE counter_id = @CounterId
              AND status IN ('Served', 'Completed')
              AND called_at IS NOT NULL
              AND served_at IS NOT NULL
              AND DATE(served_at) = CURDATE()";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CounterId", counterId);

        var result = await cmd.ExecuteScalarAsync();
        if (result == null || result == DBNull.Value)
        {
            return 0;
        }

        return Convert.ToInt32(Math.Round(Convert.ToDouble(result), MidpointRounding.AwayFromZero));
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
            CalledAt             = reader.IsDBNull(reader.GetOrdinal("called_at"))              ? null : reader.GetDateTime(reader.GetOrdinal("called_at")),
            CreatedAt            = reader.GetDateTime(reader.GetOrdinal("created_at")),
            UpdatedAt            = reader.IsDBNull(reader.GetOrdinal("updated_at"))             ? null : reader.GetDateTime(reader.GetOrdinal("updated_at")),
            QueuePosition        = reader.IsDBNull(reader.GetOrdinal("queue_position"))         ? null : reader.GetInt32(reader.GetOrdinal("queue_position"))
        };
    }
}
