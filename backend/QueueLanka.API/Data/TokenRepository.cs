using MySql.Data.MySqlClient;
using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public class TokenRepository : ITokenRepository
{
    private readonly string _connectionString;

    public TokenRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");
    }

    public async Task<Token> CreateAsync(Token token)
    {
        const string sql = @"
            INSERT INTO tokens (center_id, user_id, appointment_id, token_number, issued_date, status, 
                                issued_time, estimated_service_time, served_time, completed_time, queue_position)
            VALUES (@CenterId, @UserId, @AppointmentId, @TokenNumber, @IssuedDate, @Status,
                    @IssuedTime, @EstimatedServiceTime, @ServedTime, @CompletedTime, @QueuePosition);
            SELECT LAST_INSERT_ID();";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);

        cmd.Parameters.AddWithValue("@CenterId", token.CenterId);
        cmd.Parameters.AddWithValue("@UserId", token.UserId.HasValue ? token.UserId.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("@AppointmentId", token.AppointmentId.HasValue ? token.AppointmentId.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("@TokenNumber", token.TokenNumber);
        cmd.Parameters.AddWithValue("@IssuedDate", token.IssuedDate.Date);
        cmd.Parameters.AddWithValue("@Status", token.Status);
        cmd.Parameters.AddWithValue("@IssuedTime", token.IssuedTime);
        cmd.Parameters.AddWithValue("@EstimatedServiceTime", token.EstimatedServiceTime.HasValue ? token.EstimatedServiceTime.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("@ServedTime", token.ServedTime.HasValue ? token.ServedTime.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("@CompletedTime", token.CompletedTime.HasValue ? token.CompletedTime.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("@QueuePosition", token.QueuePosition.HasValue ? token.QueuePosition.Value : DBNull.Value);

        var id = await cmd.ExecuteScalarAsync();
        token.TokenId = Convert.ToInt32(id);
        token.CreatedAt = DateTime.UtcNow;

        return token;
    }

    public async Task<Token?> GetByIdAsync(int tokenId)
    {
        const string sql = @"
            SELECT token_id, center_id, user_id, appointment_id, token_number, issued_date, status,
                   issued_time, estimated_service_time, served_time, completed_time, cancelled_at, created_at, updated_at, queue_position
            FROM tokens
            WHERE token_id = @Id
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", tokenId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapToken((MySqlDataReader)reader) : null;
    }

    public async Task<Token?> GetByNumberDateCenterAsync(int centerId, DateTime date, string tokenNumber)
    {
        const string sql = @"
            SELECT token_id, center_id, user_id, appointment_id, token_number, issued_date, status,
                   issued_time, estimated_service_time, served_time, completed_time, cancelled_at, created_at, updated_at, queue_position
            FROM tokens
            WHERE center_id = @CenterId AND issued_date = @Date AND token_number = @TokenNumber
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CenterId", centerId);
        cmd.Parameters.AddWithValue("@Date", date.Date);
        cmd.Parameters.AddWithValue("@TokenNumber", tokenNumber);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapToken((MySqlDataReader)reader) : null;
    }

    public async Task<IEnumerable<Token>> GetByUserIdAsync(int userId)
    {
        const string sql = @"
            SELECT token_id, center_id, user_id, appointment_id, token_number, issued_date, status,
                   issued_time, estimated_service_time, served_time, completed_time, cancelled_at, created_at, updated_at, queue_position
            FROM tokens
            WHERE user_id = @UserId
            ORDER BY issued_date DESC, issued_time DESC";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        var list = new List<Token>();
        while(await reader.ReadAsync())
        {
            list.Add(MapToken((MySqlDataReader)reader));
        }
        return list;
    }

    public async Task<IEnumerable<Token>> GetByCenterAndDateAsync(int centerId, DateTime date)
    {
        const string sql = @"
            SELECT token_id, center_id, user_id, appointment_id, token_number, issued_date, status,
                   issued_time, estimated_service_time, served_time, completed_time, cancelled_at, created_at, updated_at, queue_position
            FROM tokens
            WHERE center_id = @CenterId AND issued_date = @Date
            ORDER BY issued_time ASC";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CenterId", centerId);
        cmd.Parameters.AddWithValue("@Date", date.Date);

        await using var reader = await cmd.ExecuteReaderAsync();
        var list = new List<Token>();
        while(await reader.ReadAsync())
        {
            list.Add(MapToken((MySqlDataReader)reader));
        }
        return list;
    }

    public async Task<int> CountByCenterAndDateAsync(int centerId, DateTime date)
    {
        const string sql = @"SELECT COUNT(*) FROM tokens WHERE center_id = @CenterId AND issued_date = @Date AND status NOT IN ('Cancelled')";
        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CenterId", centerId);
        cmd.Parameters.AddWithValue("@Date", date.Date);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> UpdateStatusAsync(int tokenId, string status)
    {
        const string sql = @"UPDATE tokens SET status = @Status WHERE token_id = @Id";
        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", tokenId);
        cmd.Parameters.AddWithValue("@Status", status);

        var affected = await cmd.ExecuteNonQueryAsync();
        return affected > 0;
    }

    public async Task<bool> CancelUserTokenAsync(int tokenId, int userId)
    {
        const string sql = @"UPDATE tokens 
                             SET status = 'Cancelled', cancelled_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP() 
                             WHERE token_id = @Id AND user_id = @UserId AND status = 'Waiting'";
        
        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", tokenId);
        cmd.Parameters.AddWithValue("@UserId", userId);

        var affected = await cmd.ExecuteNonQueryAsync();
        return affected > 0;
    }

    public async Task<bool> CancelAndShiftQueueAsync(int tokenId, int userId, bool isAdmin = false)
    {
        const string sql = "CALL sp_cancel_token_shift_queue(@TokenId, @UserId, @IsAdmin, @Success)";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@TokenId", tokenId);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@IsAdmin", isAdmin ? (byte)1 : (byte)0);

        // OUT parameter — MySQL sends it back as a result-set row.
        var successParam = new MySqlParameter("@Success", MySqlDbType.Byte)
        {
            Direction = System.Data.ParameterDirection.Output
        };
        cmd.Parameters.Add(successParam);

        await cmd.ExecuteNonQueryAsync();

        // The stored procedure sets @Success = 1 on success, 0 otherwise.
        return Convert.ToByte(successParam.Value) == 1;
    }

    private static Token MapToken(MySqlDataReader reader)
    {
        return new Token
        {
            TokenId              = reader.GetInt32(reader.GetOrdinal("token_id")),
            CenterId             = reader.GetInt32(reader.GetOrdinal("center_id")),
            UserId               = reader.IsDBNull(reader.GetOrdinal("user_id")) ? null : reader.GetInt32(reader.GetOrdinal("user_id")),
            AppointmentId        = reader.IsDBNull(reader.GetOrdinal("appointment_id")) ? null : reader.GetInt32(reader.GetOrdinal("appointment_id")),
            TokenNumber          = reader.GetString(reader.GetOrdinal("token_number")),
            IssuedDate           = reader.GetDateTime(reader.GetOrdinal("issued_date")),
            Status               = reader.GetString(reader.GetOrdinal("status")),
            IssuedTime           = reader.GetDateTime(reader.GetOrdinal("issued_time")),
            EstimatedServiceTime = reader.IsDBNull(reader.GetOrdinal("estimated_service_time")) ? null : reader.GetDateTime(reader.GetOrdinal("estimated_service_time")),
            ServedTime           = reader.IsDBNull(reader.GetOrdinal("served_time")) ? null : reader.GetDateTime(reader.GetOrdinal("served_time")),
            CompletedTime        = reader.IsDBNull(reader.GetOrdinal("completed_time")) ? null : reader.GetDateTime(reader.GetOrdinal("completed_time")),
            CancelledAt          = reader.IsDBNull(reader.GetOrdinal("cancelled_at")) ? null : reader.GetDateTime(reader.GetOrdinal("cancelled_at")),
            CreatedAt            = reader.GetDateTime(reader.GetOrdinal("created_at")),
            UpdatedAt            = reader.IsDBNull(reader.GetOrdinal("updated_at")) ? null : reader.GetDateTime(reader.GetOrdinal("updated_at")),
            QueuePosition        = reader.IsDBNull(reader.GetOrdinal("queue_position")) ? null : reader.GetInt32(reader.GetOrdinal("queue_position"))
        };
    }
}
