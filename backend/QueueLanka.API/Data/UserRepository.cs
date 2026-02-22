using MySql.Data.MySqlClient;
using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public class UserRepository : IUserRepository
{
    private readonly string _connectionString;

    public UserRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        const string sql = @"
            SELECT user_id, username, email, password_hash, role, center_id, is_active, is_email_verified, created_at
            FROM users
            WHERE username = @Username
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Username", username);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapUser((MySqlDataReader)reader) : null;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        const string sql = @"
            SELECT user_id, username, email, password_hash, role, center_id, is_active, is_email_verified, created_at
            FROM users
            WHERE email = @Email
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Email", email);

        await using var reader2 = await cmd.ExecuteReaderAsync();
        return await reader2.ReadAsync() ? MapUser((MySqlDataReader)reader2) : null;
    }

    public async Task<int> CreateAsync(User user)
    {
        const string sql = @"
            INSERT INTO users (username, email, password_hash, role, center_id, is_active, is_email_verified, created_at)
            VALUES (@Username, @Email, @PasswordHash, @Role, @CenterId, TRUE, FALSE, UTC_TIMESTAMP());
            SELECT LAST_INSERT_ID();";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Username", user.Username);
        cmd.Parameters.AddWithValue("@Email",    user.Email);
        cmd.Parameters.AddWithValue("@PasswordHash", user.PasswordHash);
        cmd.Parameters.AddWithValue("@Role",     user.Role);
        cmd.Parameters.AddWithValue("@CenterId", user.CenterId.HasValue ? user.CenterId.Value : DBNull.Value);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task SetEmailVerifiedAsync(int userId)
    {
        const string sql = @"
            UPDATE users
            SET    is_email_verified = TRUE
            WHERE  user_id = @UserId";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task UpdatePasswordAsync(int userId, string newPasswordHash)
    {
        const string sql = @"
            UPDATE users
            SET    password_hash = @Hash
            WHERE  user_id = @UserId";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Hash",   newPasswordHash);
        cmd.Parameters.AddWithValue("@UserId", userId);
        await cmd.ExecuteNonQueryAsync();
    }

    private static User MapUser(MySqlDataReader reader) => new()
    {
        UserId          = reader.GetInt32("user_id"),
        Username        = reader.GetString("username"),
        Email           = reader.GetString("email"),
        PasswordHash    = reader.GetString("password_hash"),
        Role            = reader.GetString("role"),
        CenterId        = reader.IsDBNull(reader.GetOrdinal("center_id")) ? null : reader.GetInt32("center_id"),
        IsActive        = reader.GetBoolean("is_active"),
        IsEmailVerified = reader.GetBoolean("is_email_verified"),
        CreatedAt       = reader.GetDateTime("created_at")
    };
}
