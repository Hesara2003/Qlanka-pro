using MySql.Data.MySqlClient;
using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public class PasswordResetRepository : IPasswordResetRepository
{
    private readonly string _connectionString;

    public PasswordResetRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");
    }

    public async Task<int> CreateAsync(PasswordResetToken token)
    {
        const string sql = @"
            INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
            VALUES (@UserId, @Token, @ExpiresAt, UTC_TIMESTAMP());
            SELECT LAST_INSERT_ID();";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId",    token.UserId);
        cmd.Parameters.AddWithValue("@Token",     token.Token);
        cmd.Parameters.AddWithValue("@ExpiresAt", token.ExpiresAt);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<PasswordResetToken?> GetValidByTokenAsync(string token)
    {
        const string sql = @"
            SELECT token_id, user_id, token, expires_at, used_at, created_at
            FROM   password_reset_tokens
            WHERE  token      = @Token
              AND  used_at    IS NULL
              AND  expires_at > UTC_TIMESTAMP()
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Token", token);

        await using var reader = (MySqlDataReader)await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        return new PasswordResetToken
        {
            TokenId   = reader.GetInt32("token_id"),
            UserId    = reader.GetInt32("user_id"),
            Token     = reader.GetString("token"),
            ExpiresAt = reader.GetDateTime("expires_at"),
            UsedAt    = reader.IsDBNull(reader.GetOrdinal("used_at")) ? null : reader.GetDateTime("used_at"),
            CreatedAt = reader.GetDateTime("created_at")
        };
    }

    public async Task MarkUsedAsync(int tokenId)
    {
        const string sql = @"
            UPDATE password_reset_tokens
            SET    used_at = UTC_TIMESTAMP()
            WHERE  token_id = @TokenId";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@TokenId", tokenId);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task InvalidateAllForUserAsync(int userId)
    {
        const string sql = @"
            UPDATE password_reset_tokens
            SET    used_at = UTC_TIMESTAMP()
            WHERE  user_id = @UserId
              AND  used_at IS NULL";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);
        await cmd.ExecuteNonQueryAsync();
    }
}
