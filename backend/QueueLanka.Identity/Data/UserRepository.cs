using MySqlConnector;
using QueueLanka.Identity.Models;
using QueueLanka.Shared.Exceptions;

namespace QueueLanka.Identity.Data;

public class UserRepository : IUserRepository
{
    private readonly string _connectionString;

    public UserRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");
    }

    // ── GetAllAsync ────────────────────────────────────────────────────────
    public async Task<IEnumerable<User>> GetAllAsync(string? role = null, bool? isActive = null)
    {
        var sql = new System.Text.StringBuilder(@"
            SELECT user_id, username, email, password_hash, role, center_id,
                   is_active, is_email_verified, created_at,
                   updated_at, deleted_at, deleted_by, last_login_at
            FROM   users
            WHERE  deleted_at IS NULL");

        if (role is not null)     sql.Append(" AND role = @Role");
        if (isActive.HasValue)    sql.Append(" AND is_active = @IsActive");
        sql.Append(" ORDER BY created_at DESC");

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql.ToString(), conn);
        if (role is not null)     cmd.Parameters.AddWithValue("@Role",     role);
        if (isActive.HasValue)    cmd.Parameters.AddWithValue("@IsActive", isActive.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        var users = new List<User>();
        while (await reader.ReadAsync())
            users.Add(MapUser((MySqlDataReader)reader));
        return users;
    }

    public async Task<User?> GetByIdAsync(int userId)
    {
        const string sql = @"
            SELECT user_id, username, email, password_hash, role, center_id,
                   is_active, is_email_verified, created_at,
                   updated_at, deleted_at, deleted_by, last_login_at
            FROM   users
            WHERE  user_id = @UserId
            LIMIT  1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapUser((MySqlDataReader)reader) : null;
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        const string sql = @"
            SELECT user_id, username, email, password_hash, role, center_id,
                   is_active, is_email_verified, created_at,
                   updated_at, deleted_at, deleted_by, last_login_at
            FROM   users
            WHERE  username = @Username
            LIMIT  1";

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
            SELECT user_id, username, email, password_hash, role, center_id,
                   is_active, is_email_verified, created_at,
                   updated_at, deleted_at, deleted_by, last_login_at
            FROM   users
            WHERE  email = @Email
            LIMIT  1";

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
            VALUES (@Username, @Email, @PasswordHash, @Role, @CenterId, TRUE, TRUE, UTC_TIMESTAMP());
            SELECT LAST_INSERT_ID();";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Username", user.Username);
        cmd.Parameters.AddWithValue("@Email",    user.Email);
        cmd.Parameters.AddWithValue("@PasswordHash", user.PasswordHash);
        cmd.Parameters.AddWithValue("@Role",     user.Role);
        cmd.Parameters.AddWithValue("@CenterId", user.CenterId.HasValue ? user.CenterId.Value : DBNull.Value);

        try
        {
            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result);
        }
        catch (MySqlException ex) when (IsCenterConstraintError(ex))
        {
            throw new AppException(422, "INVALID_CENTER", "Service center ID is invalid or unavailable for officer registration.");
        }
        catch (MySqlException ex) when (ex.Number == 1062)
        {
            if (ex.Message.Contains("username", StringComparison.OrdinalIgnoreCase))
                throw new DuplicateUsernameException(user.Username);

            if (ex.Message.Contains("email", StringComparison.OrdinalIgnoreCase))
                throw new DuplicateEmailException(user.Email);

            throw new AppException(409, "DUPLICATE_USER", "A user with these details already exists.");
        }
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

    // ── UpdateLastLoginAsync ───────────────────────────────────────────────
    public async Task UpdateLastLoginAsync(int userId)
    {
        const string sql = @"
            UPDATE users
            SET    last_login_at = UTC_TIMESTAMP()
            WHERE  user_id = @UserId";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);
        await cmd.ExecuteNonQueryAsync();
    }

    // ── SoftDeleteAsync ────────────────────────────────────────────────────
    public async Task SoftDeleteAsync(int userId, int? deletedBy)
    {
        const string sql = @"
            UPDATE users
            SET    is_active  = FALSE,
                   deleted_at = UTC_TIMESTAMP(),
                   deleted_by = @DeletedBy
            WHERE  user_id    = @UserId
              AND  deleted_at IS NULL";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId",    userId);
        cmd.Parameters.AddWithValue("@DeletedBy", deletedBy.HasValue ? deletedBy.Value : DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    // ── RestoreAsync ───────────────────────────────────────────────────────
    public async Task RestoreAsync(int userId)
    {
        const string sql = @"
            UPDATE users
            SET    is_active  = TRUE,
                   deleted_at = NULL,
                   deleted_by = NULL
            WHERE  user_id    = @UserId";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);
        await cmd.ExecuteNonQueryAsync();
    }

    // ── SetActiveAsync ─────────────────────────────────────────────────────
    public async Task SetActiveAsync(int userId, bool isActive)
    {
        const string sql = @"
            UPDATE users
            SET    is_active = @IsActive
            WHERE  user_id   = @UserId";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId",   userId);
        cmd.Parameters.AddWithValue("@IsActive", isActive);
        await cmd.ExecuteNonQueryAsync();
    }

    // ── AddAuditLogAsync ───────────────────────────────────────────────────
    public async Task AddAuditLogAsync(UserAuditLog entry)
    {
        const string sql = @"
            INSERT INTO user_audit_log
                   (user_id, action, performed_by, old_values, new_values, notes, performed_at)
            VALUES (@UserId, @Action, @PerformedBy, @OldValues, @NewValues, @Notes, UTC_TIMESTAMP())";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId",      entry.UserId);
        cmd.Parameters.AddWithValue("@Action",      entry.Action);
        cmd.Parameters.AddWithValue("@PerformedBy", entry.PerformedBy.HasValue ? entry.PerformedBy.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("@OldValues",   entry.OldValues is not null ? entry.OldValues : DBNull.Value);
        cmd.Parameters.AddWithValue("@NewValues",   entry.NewValues is not null ? entry.NewValues : DBNull.Value);
        cmd.Parameters.AddWithValue("@Notes",       entry.Notes     is not null ? entry.Notes     : DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    private static User MapUser(MySqlDataReader reader) => new()
    {
        UserId          = reader.GetInt32("user_id"),
        Username        = reader.GetString("username"),
        Email           = reader.GetString("email"),
        PasswordHash    = reader.GetString("password_hash"),
        Role            = reader.GetString("role"),
        CenterId        = reader.IsDBNull(reader.GetOrdinal("center_id"))   ? null : reader.GetInt32("center_id"),
        IsActive        = reader.GetBoolean("is_active"),
        IsEmailVerified = reader.GetBoolean("is_email_verified"),
        CreatedAt       = reader.GetDateTime("created_at"),
        // SCRUM-76 audit columns (may be absent in legacy SELECT queries — guard with HasColumn)
        UpdatedAt       = HasColumn(reader, "updated_at")   && !reader.IsDBNull(reader.GetOrdinal("updated_at"))   ? reader.GetDateTime("updated_at")   : null,
        DeletedAt       = HasColumn(reader, "deleted_at")   && !reader.IsDBNull(reader.GetOrdinal("deleted_at"))   ? reader.GetDateTime("deleted_at")   : null,
        DeletedBy       = HasColumn(reader, "deleted_by")   && !reader.IsDBNull(reader.GetOrdinal("deleted_by"))   ? reader.GetInt32("deleted_by")      : null,
        LastLoginAt     = HasColumn(reader, "last_login_at") && !reader.IsDBNull(reader.GetOrdinal("last_login_at")) ? reader.GetDateTime("last_login_at") : null,
    };

    /// <summary>Returns true when the reader result-set contains the named column.</summary>
    private static bool HasColumn(MySqlDataReader reader, string columnName)
    {
        for (int i = 0; i < reader.FieldCount; i++)
            if (reader.GetName(i).Equals(columnName, StringComparison.OrdinalIgnoreCase))
                return true;
        return false;
    }

    private static bool IsCenterConstraintError(MySqlException ex)
    {
        if (ex.Number is 1452 or 1451 or 1216 or 1217)
            return true;

        return ex.Message.Contains("center_id", StringComparison.OrdinalIgnoreCase)
            && ex.Message.Contains("foreign key", StringComparison.OrdinalIgnoreCase);
    }
}
