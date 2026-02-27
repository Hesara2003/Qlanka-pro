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
            SELECT center_id, name, address, phone, email, description, timezone, 
                   capacity, opening_time, closing_time, is_active, created_at, updated_at
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
            SELECT center_id, name, address, phone, email, description, timezone, 
                   capacity, opening_time, closing_time, is_active, created_at, updated_at
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
            CenterId    = reader.GetInt32("center_id"),
            Name        = reader.GetString("name"),
            Address     = reader.GetString("address"),
            Phone       = reader.IsDBNull(reader.GetOrdinal("phone")) ? null : reader.GetString("phone"),
            Email       = reader.IsDBNull(reader.GetOrdinal("email")) ? null : reader.GetString("email"),
            Description = reader.IsDBNull(reader.GetOrdinal("description")) ? null : reader.GetString("description"),
            Timezone    = reader.GetString("timezone"),
            Capacity    = reader.GetInt32("capacity"),
            OpeningTime = reader.GetTimeSpan("opening_time"),
            ClosingTime = reader.GetTimeSpan("closing_time"),
            IsActive    = reader.GetBoolean("is_active"),
            CreatedAt   = reader.GetDateTime("created_at"),
            UpdatedAt   = reader.IsDBNull(reader.GetOrdinal("updated_at")) ? null : reader.GetDateTime("updated_at")
        };
    }

    public async Task<CenterAvailability?> GetAvailabilityForDateAsync(int centerId, DateTime date)
    {
        const string sql = @"
            SELECT availability_id, center_id, date, is_available, opening_time, closing_time, 
                   reason, created_at, updated_at
            FROM center_availability
            WHERE center_id = @CenterId AND date = @Date
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CenterId", centerId);
        cmd.Parameters.AddWithValue("@Date", date.Date);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        return new CenterAvailability
        {
            AvailabilityId = reader.GetInt32("availability_id"),
            CenterId       = reader.GetInt32("center_id"),
            Date           = reader.GetDateTime("date"),
            IsAvailable    = reader.GetBoolean("is_available"),
            OpeningTime    = reader.IsDBNull(reader.GetOrdinal("opening_time")) ? null : reader.GetTimeSpan("opening_time"),
            ClosingTime    = reader.IsDBNull(reader.GetOrdinal("closing_time")) ? null : reader.GetTimeSpan("closing_time"),
            Reason         = reader.IsDBNull(reader.GetOrdinal("reason")) ? null : reader.GetString("reason"),
            CreatedAt      = reader.GetDateTime("created_at"),
            UpdatedAt      = reader.IsDBNull(reader.GetOrdinal("updated_at")) ? null : reader.GetDateTime("updated_at")
        };
    }

    public async Task<IEnumerable<CenterOperatingDay>> GetOperatingDaysAsync(int centerId)
    {
        const string sql = @"
            SELECT operating_day_id, center_id, day_of_week, is_open, opening_time, closing_time, created_at
            FROM center_operating_days
            WHERE center_id = @CenterId
            ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CenterId", centerId);

        await using var reader = await cmd.ExecuteReaderAsync();
        var operatingDays = new List<CenterOperatingDay>();

        while (await reader.ReadAsync())
        {
            operatingDays.Add(new CenterOperatingDay
            {
                OperatingDayId = reader.GetInt32("operating_day_id"),
                CenterId       = reader.GetInt32("center_id"),
                DayOfWeek      = reader.GetString("day_of_week"),
                IsOpen         = reader.GetBoolean("is_open"),
                OpeningTime    = reader.IsDBNull(reader.GetOrdinal("opening_time")) ? null : reader.GetTimeSpan("opening_time"),
                ClosingTime    = reader.IsDBNull(reader.GetOrdinal("closing_time")) ? null : reader.GetTimeSpan("closing_time"),
                CreatedAt      = reader.GetDateTime("created_at")
            });
        }

        return operatingDays;
    }

    public async Task<bool> IsCenterAvailableAsync(int centerId, DateTime date)
    {
        const string sql = @"
            SELECT is_currently_open
            FROM v_center_current_availability
            WHERE center_id = @CenterId";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CenterId", centerId);

        var result = await cmd.ExecuteScalarAsync();
        return result != null && Convert.ToBoolean(result);
    }
}
