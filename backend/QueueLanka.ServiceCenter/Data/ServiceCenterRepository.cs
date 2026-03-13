using MySqlConnector;
using QueueLanka.Shared.Exceptions;
using QueueLanka.ServiceCenter.Models;

namespace QueueLanka.ServiceCenter.Data;

public class ServiceCenterRepository : IServiceCenterRepository
{
    private readonly string _connectionString;

    public ServiceCenterRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");
    }

    public async Task<IEnumerable<Models.ServiceCenter>> GetAllAsync()
    {
        const string sql = @"
            SELECT center_id, full_address AS address, name, phone, email, description, timezone,
                   capacity, average_service_time_minutes, opening_time, closing_time,
                   is_active, created_at, updated_at,
                   location_id, street_address, city, district, province, postal_code,
                   country, latitude, longitude, google_maps_url, landmark
            FROM v_center_with_location
            ORDER BY name ASC";

        try
        {
            await using var conn = new MySqlConnection(_connectionString);
            await conn.OpenAsync();
            await using var cmd = new MySqlCommand(sql, conn);
            await using var reader = await cmd.ExecuteReaderAsync();

            var centers = new List<Models.ServiceCenter>();
            while (await reader.ReadAsync())
                centers.Add(MapServiceCenter((MySqlDataReader)reader));

            return centers;
        }
        catch (MySqlException ex)
        {
            throw new DataAccessException("Database error while retrieving service centers.", ex);
        }
    }

    public async Task<Models.ServiceCenter?> GetByIdAsync(int centerId)
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

        try
        {
            await using var conn = new MySqlConnection(_connectionString);
            await conn.OpenAsync();
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@CenterId", centerId);

            await using var reader = await cmd.ExecuteReaderAsync();
            return await reader.ReadAsync() ? MapServiceCenter((MySqlDataReader)reader) : null;
        }
        catch (MySqlException ex)
        {
            throw new DataAccessException($"Database error while retrieving service center {centerId}.", ex);
        }
    }

    public async Task<bool> ExistsByNameAndAddressAsync(string name, string address)
    {
        const string sql = @"
            SELECT COUNT(*) FROM centers
            WHERE LOWER(name) = LOWER(@Name) AND LOWER(address) = LOWER(@Address)";

        try
        {
            await using var conn = new MySqlConnection(_connectionString);
            await conn.OpenAsync();
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Name",    name);
            cmd.Parameters.AddWithValue("@Address", address);

            var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            return count > 0;
        }
        catch (MySqlException ex)
        {
            throw new DataAccessException("Database error while checking for duplicate service center.", ex);
        }
    }

    public async Task<Models.ServiceCenter> CreateAsync(Models.ServiceCenter center)
    {
        try
        {
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

            // Optionally seed an initial location row when the caller supplies
            // structured location data on the ServiceCenter.Location property.
            if (center.Location is not null)
            {
                center.Location.CenterId = center.CenterId;
                center.Location = await UpsertLocationCoreAsync(center.Location, conn, (MySqlTransaction)tx);
            }

            await tx.CommitAsync();
            return center;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
        }
        catch (MySqlException ex)
        {
            throw new DataAccessException("Database error while creating service center.", ex);
        }
    }

    private static Models.ServiceCenter MapServiceCenter(MySqlDataReader reader)
    {
        var center = new Models.ServiceCenter
        {
            CenterId    = reader.GetInt32(reader.GetOrdinal("center_id")),
            Name        = reader.GetString(reader.GetOrdinal("name")),
            Address     = reader.GetString(reader.GetOrdinal("address")),
            Phone       = reader.IsDBNull(reader.GetOrdinal("phone"))        ? null : reader.GetString(reader.GetOrdinal("phone")),
            Email       = reader.IsDBNull(reader.GetOrdinal("email"))        ? null : reader.GetString(reader.GetOrdinal("email")),
            Description = reader.IsDBNull(reader.GetOrdinal("description"))  ? null : reader.GetString(reader.GetOrdinal("description")),
            Timezone    = reader.GetString(reader.GetOrdinal("timezone")),
            Capacity    = reader.GetInt32(reader.GetOrdinal("capacity")),
            AverageServiceTimeMinutes = reader.GetInt32(reader.GetOrdinal("average_service_time_minutes")),
            OpeningTime = (TimeSpan)reader.GetValue(reader.GetOrdinal("opening_time")),
            ClosingTime = (TimeSpan)reader.GetValue(reader.GetOrdinal("closing_time")),
            IsActive    = reader.GetBoolean(reader.GetOrdinal("is_active")),
            CreatedAt   = reader.GetDateTime(reader.GetOrdinal("created_at")),
            UpdatedAt   = reader.IsDBNull(reader.GetOrdinal("updated_at")) ? null : reader.GetDateTime(reader.GetOrdinal("updated_at"))
        };

        // Populate the structured location when the result set includes location columns
        // (present when using v_center_with_location; absent on raw centers queries).
        int locationIdOrdinal = reader.GetOrdinal("location_id");
        if (!reader.IsDBNull(locationIdOrdinal))
        {
            center.Location = new CenterLocation
            {
                LocationId    = reader.GetInt32(locationIdOrdinal),
                CenterId      = center.CenterId,
                StreetAddress = reader.IsDBNull(reader.GetOrdinal("street_address")) ? null : reader.GetString(reader.GetOrdinal("street_address")),
                City          = reader.IsDBNull(reader.GetOrdinal("city"))           ? null : reader.GetString(reader.GetOrdinal("city")),
                District      = reader.IsDBNull(reader.GetOrdinal("district"))       ? null : reader.GetString(reader.GetOrdinal("district")),
                Province      = reader.IsDBNull(reader.GetOrdinal("province"))       ? null : reader.GetString(reader.GetOrdinal("province")),
                PostalCode    = reader.IsDBNull(reader.GetOrdinal("postal_code"))    ? null : reader.GetString(reader.GetOrdinal("postal_code")),
                Country       = reader.IsDBNull(reader.GetOrdinal("country"))        ? "Sri Lanka" : reader.GetString(reader.GetOrdinal("country")),
                Latitude      = reader.IsDBNull(reader.GetOrdinal("latitude"))       ? null : reader.GetDecimal(reader.GetOrdinal("latitude")),
                Longitude     = reader.IsDBNull(reader.GetOrdinal("longitude"))      ? null : reader.GetDecimal(reader.GetOrdinal("longitude")),
                GoogleMapsUrl = reader.IsDBNull(reader.GetOrdinal("google_maps_url")) ? null : reader.GetString(reader.GetOrdinal("google_maps_url")),
                Landmark      = reader.IsDBNull(reader.GetOrdinal("landmark"))       ? null : reader.GetString(reader.GetOrdinal("landmark")),
            };
        }

        return center;
    }

    // ── Location methods ──────────────────────────────────────────────────

    public async Task<CenterLocation?> GetLocationAsync(int centerId)
    {
        const string sql = @"
            SELECT location_id, center_id, street_address, city, district, province,
                   postal_code, country, latitude, longitude, google_maps_url, landmark,
                   created_at, updated_at
            FROM center_locations
            WHERE center_id = @CenterId
            LIMIT 1";

        try
        {
            await using var conn = new MySqlConnection(_connectionString);
            await conn.OpenAsync();
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@CenterId", centerId);

            await using var reader = await cmd.ExecuteReaderAsync();
            return await reader.ReadAsync() ? MapLocation((MySqlDataReader)reader) : null;
        }
        catch (MySqlException ex)
        {
            throw new DataAccessException($"Database error while retrieving location for center {centerId}.", ex);
        }
    }

    public async Task<CenterLocation> UpsertLocationAsync(CenterLocation location)
    {
        try
        {
            await using var conn = new MySqlConnection(_connectionString);
            await conn.OpenAsync();
            return await UpsertLocationCoreAsync(location, conn, null);
        }
        catch (MySqlException ex)
        {
            throw new DataAccessException("Database error while upserting location.", ex);
        }
    }

    /// <summary>
    /// Core INSERT … ON DUPLICATE KEY UPDATE. Can be called inside an existing
    /// transaction (pass <paramref name="tx"/>) or standalone (pass <c>null</c>).
    /// </summary>
    private static async Task<CenterLocation> UpsertLocationCoreAsync(
        CenterLocation location,
        MySqlConnection conn,
        MySqlTransaction? tx)
    {
        const string sql = @"
            INSERT INTO center_locations
                (center_id, street_address, city, district, province, postal_code,
                 country, latitude, longitude, google_maps_url, landmark)
            VALUES
                (@CenterId, @StreetAddress, @City, @District, @Province, @PostalCode,
                 @Country, @Latitude, @Longitude, @GoogleMapsUrl, @Landmark)
            ON DUPLICATE KEY UPDATE
                street_address  = VALUES(street_address),
                city            = VALUES(city),
                district        = VALUES(district),
                province        = VALUES(province),
                postal_code     = VALUES(postal_code),
                country         = VALUES(country),
                latitude        = VALUES(latitude),
                longitude       = VALUES(longitude),
                google_maps_url = VALUES(google_maps_url),
                landmark        = VALUES(landmark);
            SELECT LAST_INSERT_ID();";

        await using var cmd = tx is null
            ? new MySqlCommand(sql, conn)
            : new MySqlCommand(sql, conn, tx);

        cmd.Parameters.AddWithValue("@CenterId",      location.CenterId);
        cmd.Parameters.AddWithValue("@StreetAddress", (object?)location.StreetAddress ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@City",          (object?)location.City          ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@District",      (object?)location.District      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Province",      (object?)location.Province      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@PostalCode",    (object?)location.PostalCode    ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Country",       location.Country);
        cmd.Parameters.AddWithValue("@Latitude",      (object?)location.Latitude      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Longitude",     (object?)location.Longitude     ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@GoogleMapsUrl", (object?)location.GoogleMapsUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Landmark",      (object?)location.Landmark      ?? DBNull.Value);

        var result = await cmd.ExecuteScalarAsync();
        // LAST_INSERT_ID() returns 0 on an UPDATE; in that case re-load the existing row's ID.
        long insertId = Convert.ToInt64(result);
        if (insertId > 0)
            location.LocationId = (int)insertId;

        location.CreatedAt = DateTime.UtcNow;
        return location;
    }

    private static CenterLocation MapLocation(MySqlDataReader reader)
    {
        return new CenterLocation
        {
            LocationId    = reader.GetInt32(reader.GetOrdinal("location_id")),
            CenterId      = reader.GetInt32(reader.GetOrdinal("center_id")),
            StreetAddress = reader.IsDBNull(reader.GetOrdinal("street_address")) ? null : reader.GetString(reader.GetOrdinal("street_address")),
            City          = reader.IsDBNull(reader.GetOrdinal("city"))           ? null : reader.GetString(reader.GetOrdinal("city")),
            District      = reader.IsDBNull(reader.GetOrdinal("district"))       ? null : reader.GetString(reader.GetOrdinal("district")),
            Province      = reader.IsDBNull(reader.GetOrdinal("province"))       ? null : reader.GetString(reader.GetOrdinal("province")),
            PostalCode    = reader.IsDBNull(reader.GetOrdinal("postal_code"))    ? null : reader.GetString(reader.GetOrdinal("postal_code")),
            Country       = reader.IsDBNull(reader.GetOrdinal("country"))        ? "Sri Lanka" : reader.GetString(reader.GetOrdinal("country")),
            Latitude      = reader.IsDBNull(reader.GetOrdinal("latitude"))       ? null : reader.GetDecimal(reader.GetOrdinal("latitude")),
            Longitude     = reader.IsDBNull(reader.GetOrdinal("longitude"))      ? null : reader.GetDecimal(reader.GetOrdinal("longitude")),
            GoogleMapsUrl = reader.IsDBNull(reader.GetOrdinal("google_maps_url")) ? null : reader.GetString(reader.GetOrdinal("google_maps_url")),
            Landmark      = reader.IsDBNull(reader.GetOrdinal("landmark"))       ? null : reader.GetString(reader.GetOrdinal("landmark")),
            CreatedAt     = reader.GetDateTime(reader.GetOrdinal("created_at")),
            UpdatedAt     = reader.IsDBNull(reader.GetOrdinal("updated_at"))     ? null : reader.GetDateTime(reader.GetOrdinal("updated_at")),
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

        try
        {
            await using var conn = new MySqlConnection(_connectionString);
            await conn.OpenAsync();
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@CenterId", centerId);
            cmd.Parameters.AddWithValue("@Date", date.Date);

            await using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return null;

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
        catch (MySqlException ex)
        {
            throw new DataAccessException($"Database error while retrieving availability for center {centerId}.", ex);
        }
    }

    public async Task<IEnumerable<CenterOperatingDay>> GetOperatingDaysAsync(int centerId)
    {
        const string sql = @"
            SELECT operating_day_id, center_id, day_of_week, is_open, opening_time, closing_time, created_at
            FROM center_operating_days
            WHERE center_id = @CenterId
            ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')";

        try
        {
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
        catch (MySqlException ex)
        {
            throw new DataAccessException($"Database error while retrieving operating days for center {centerId}.", ex);
        }
    }

    public async Task<bool> IsCenterAvailableAsync(int centerId, DateTime date)
    {
        const string sql = @"
            SELECT is_currently_open
            FROM v_center_current_availability
            WHERE center_id = @CenterId";

        try
        {
            await using var conn = new MySqlConnection(_connectionString);
            await conn.OpenAsync();
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@CenterId", centerId);

            var result = await cmd.ExecuteScalarAsync();
            return result != null && Convert.ToBoolean(result);
        }
        catch (MySqlException ex)
        {
            throw new DataAccessException($"Database error while checking availability for center {centerId}.", ex);
        }
    }
}
