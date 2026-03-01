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
        // v_center_with_location LEFT JOINs centers ↔ center_locations so
        // the location columns are present but nullable for centers without a row.
        const string sql = @"
            SELECT center_id, full_address AS address, name, phone, email, description, timezone,
                   capacity, average_service_time_minutes, opening_time, closing_time,
                   is_active, created_at, updated_at,
                   location_id, street_address, city, district, province, postal_code,
                   country, latitude, longitude, google_maps_url, landmark
            FROM v_center_with_location
            ORDER BY name ASC";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        var centers = new List<ServiceCenter>();
        while (await reader.ReadAsync())
            centers.Add(MapServiceCenter((MySqlDataReader)reader));

        return centers;
    }

    public async Task<ServiceCenter?> GetByIdAsync(int centerId)
    {
        const string sql = @"
            SELECT center_id, full_address AS address, name, phone, email, description, timezone,
                   capacity, average_service_time_minutes, opening_time, closing_time,
                   is_active, created_at, updated_at,
                   location_id, street_address, city, district, province, postal_code,
                   country, latitude, longitude, google_maps_url, landmark
            FROM v_center_with_location
            WHERE center_id = @CenterId
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CenterId", centerId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapServiceCenter((MySqlDataReader)reader) : null;
    }

    public async Task<bool> ExistsByNameAndAddressAsync(string name, string address)
    {
        const string sql = @"
            SELECT COUNT(*) FROM centers
            WHERE LOWER(name) = LOWER(@Name) AND LOWER(address) = LOWER(@Address)";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Name", name);
        cmd.Parameters.AddWithValue("@Address", address);

        var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
        return count > 0;
    }

    public async Task<ServiceCenter> CreateAsync(ServiceCenter center)
    {
        // Insert the center row inside a transaction so that the default operating-day
        // rows (Mon–Fri) are always created atomically with the center itself.
        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();

        try
        {
            const string insertCenter = @"
                INSERT INTO centers
                    (name, address, phone, email, description, timezone, capacity,
                     average_service_time_minutes, opening_time, closing_time, is_active)
                VALUES
                    (@Name, @Address, @Phone, @Email, @Description, @Timezone, @Capacity,
                     @AvgTime, @OpeningTime, @ClosingTime, @IsActive);
                SELECT LAST_INSERT_ID();";

            await using var cmdInsert = new MySqlCommand(insertCenter, conn, (MySqlTransaction)tx);
            cmdInsert.Parameters.AddWithValue("@Name",        center.Name);
            cmdInsert.Parameters.AddWithValue("@Address",     center.Address);
            cmdInsert.Parameters.AddWithValue("@Phone",       (object?)center.Phone       ?? DBNull.Value);
            cmdInsert.Parameters.AddWithValue("@Email",       (object?)center.Email       ?? DBNull.Value);
            cmdInsert.Parameters.AddWithValue("@Description", (object?)center.Description ?? DBNull.Value);
            cmdInsert.Parameters.AddWithValue("@Timezone",    center.Timezone);
            cmdInsert.Parameters.AddWithValue("@Capacity",    center.Capacity);
            cmdInsert.Parameters.AddWithValue("@AvgTime",     center.AverageServiceTimeMinutes);
            cmdInsert.Parameters.AddWithValue("@OpeningTime", center.OpeningTime);
            cmdInsert.Parameters.AddWithValue("@ClosingTime", center.ClosingTime);
            cmdInsert.Parameters.AddWithValue("@IsActive",    center.IsActive);

            center.CenterId = Convert.ToInt32(await cmdInsert.ExecuteScalarAsync());
            center.CreatedAt = DateTime.UtcNow;

            // Seed default Mon–Fri operating days (mirrors migration 003 behaviour for new centers).
            const string insertDays = @"
                INSERT INTO center_operating_days
                    (center_id, day_of_week, is_open, opening_time, closing_time)
                VALUES
                    (@CId, 'monday',    TRUE, @Open, @Close),
                    (@CId, 'tuesday',   TRUE, @Open, @Close),
                    (@CId, 'wednesday', TRUE, @Open, @Close),
                    (@CId, 'thursday',  TRUE, @Open, @Close),
                    (@CId, 'friday',    TRUE, @Open, @Close),
                    (@CId, 'saturday',  FALSE, @Open, @Close),
                    (@CId, 'sunday',    FALSE, @Open, @Close);";

            await using var cmdDays = new MySqlCommand(insertDays, conn, (MySqlTransaction)tx);
            cmdDays.Parameters.AddWithValue("@CId",   center.CenterId);
            cmdDays.Parameters.AddWithValue("@Open",  center.OpeningTime);
            cmdDays.Parameters.AddWithValue("@Close", center.ClosingTime);
            await cmdDays.ExecuteNonQueryAsync();

            await tx.CommitAsync();
            return center;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    private static ServiceCenter MapServiceCenter(MySqlDataReader reader)
    {
        return new ServiceCenter
        {
            CenterId    = reader.GetInt32(reader.GetOrdinal("center_id")),
            Name        = reader.GetString(reader.GetOrdinal("name")),
            Address     = reader.GetString(reader.GetOrdinal("address")),
            Phone       = reader.IsDBNull(reader.GetOrdinal("phone")) ? null : reader.GetString(reader.GetOrdinal("phone")),
            Email       = reader.IsDBNull(reader.GetOrdinal("email")) ? null : reader.GetString(reader.GetOrdinal("email")),
            Description = reader.IsDBNull(reader.GetOrdinal("description")) ? null : reader.GetString(reader.GetOrdinal("description")),
            Timezone    = reader.GetString(reader.GetOrdinal("timezone")),
            Capacity    = reader.GetInt32(reader.GetOrdinal("capacity")),
            AverageServiceTimeMinutes = reader.GetInt32(reader.GetOrdinal("average_service_time_minutes")),
            OpeningTime = (TimeSpan)reader.GetValue(reader.GetOrdinal("opening_time")),
            ClosingTime = (TimeSpan)reader.GetValue(reader.GetOrdinal("closing_time")),
            IsActive    = reader.GetBoolean(reader.GetOrdinal("is_active")),
            CreatedAt   = reader.GetDateTime(reader.GetOrdinal("created_at")),
            UpdatedAt   = reader.IsDBNull(reader.GetOrdinal("updated_at")) ? null : reader.GetDateTime(reader.GetOrdinal("updated_at"))
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
            AvailabilityId = reader.GetInt32(reader.GetOrdinal("availability_id")),
            CenterId       = reader.GetInt32(reader.GetOrdinal("center_id")),
            Date           = reader.GetDateTime(reader.GetOrdinal("date")),
            IsAvailable    = reader.GetBoolean(reader.GetOrdinal("is_available")),
            OpeningTime    = reader.IsDBNull(reader.GetOrdinal("opening_time")) ? null : (TimeSpan)reader.GetValue(reader.GetOrdinal("opening_time")),
            ClosingTime    = reader.IsDBNull(reader.GetOrdinal("closing_time")) ? null : (TimeSpan)reader.GetValue(reader.GetOrdinal("closing_time")),
            Reason         = reader.IsDBNull(reader.GetOrdinal("reason")) ? null : reader.GetString(reader.GetOrdinal("reason")),
            CreatedAt      = reader.GetDateTime(reader.GetOrdinal("created_at")),
            UpdatedAt      = reader.IsDBNull(reader.GetOrdinal("updated_at")) ? null : reader.GetDateTime(reader.GetOrdinal("updated_at"))
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
                OperatingDayId = reader.GetInt32(reader.GetOrdinal("operating_day_id")),
                CenterId       = reader.GetInt32(reader.GetOrdinal("center_id")),
                DayOfWeek      = reader.GetString(reader.GetOrdinal("day_of_week")),
                IsOpen         = reader.GetBoolean(reader.GetOrdinal("is_open")),
                OpeningTime    = reader.IsDBNull(reader.GetOrdinal("opening_time")) ? null : (TimeSpan)reader.GetValue(reader.GetOrdinal("opening_time")),
                ClosingTime    = reader.IsDBNull(reader.GetOrdinal("closing_time")) ? null : (TimeSpan)reader.GetValue(reader.GetOrdinal("closing_time")),
                CreatedAt      = reader.GetDateTime(reader.GetOrdinal("created_at"))
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
