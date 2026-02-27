using MySql.Data.MySqlClient;
using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public class ServiceCenterRepository : IServiceCenterRepository
{
    private readonly string _connectionString;

    public ServiceCenterRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");
    }

    public async Task<IEnumerable<ServiceCenter>> GetAllAsync()
    {
        const string sql = @"
            SELECT center_id, name, address, timezone, capacity, is_active, created_at
            FROM centers
            ORDER BY name ASC";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        var centers = new List<ServiceCenter>();
        while (await reader.ReadAsync())
        {
            centers.Add(MapServiceCenter((MySqlDataReader)reader));
        }

        return centers;
    }

    public async Task<ServiceCenter?> GetByIdAsync(int centerId)
    {
        const string sql = @"
            SELECT center_id, name, address, timezone, capacity, is_active, created_at
            FROM centers
            WHERE center_id = @CenterId
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CenterId", centerId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapServiceCenter((MySqlDataReader)reader) : null;
    }

    private static ServiceCenter MapServiceCenter(MySqlDataReader reader)
    {
        return new ServiceCenter
        {
            CenterId  = reader.GetInt32("center_id"),
            Name      = reader.GetString("name"),
            Address   = reader.GetString("address"),
            Timezone  = reader.GetString("timezone"),
            Capacity  = reader.GetInt32("capacity"),
            IsActive  = reader.GetBoolean("is_active"),
            CreatedAt = reader.GetDateTime("created_at")
        };
    }
}
