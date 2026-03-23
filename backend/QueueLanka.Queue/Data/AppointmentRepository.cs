using System.Data;
using MySqlConnector;
using QueueLanka.Queue.Models;

namespace QueueLanka.Queue.Data;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly string _connectionString;

    public AppointmentRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");
    }

    public async Task<Appointment> CreateAsync(Appointment appointment)
    {
        const string sql = @"
            INSERT INTO appointments (center_id, user_id, appointment_date, appointment_time, status)
            VALUES (@CenterId, @UserId, @AppointmentDate, @AppointmentTime, @Status);
            SELECT LAST_INSERT_ID();";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);

        cmd.Parameters.AddWithValue("@CenterId", appointment.CenterId);
        cmd.Parameters.AddWithValue("@UserId", appointment.UserId);
        cmd.Parameters.AddWithValue("@AppointmentDate", appointment.AppointmentDate.Date); 
        cmd.Parameters.AddWithValue("@AppointmentTime", appointment.AppointmentTime);
        cmd.Parameters.AddWithValue("@Status", appointment.Status);

        var id = await cmd.ExecuteScalarAsync();
        appointment.AppointmentId = Convert.ToInt32(id);
        
        appointment.CreatedAt = DateTime.UtcNow;

        return appointment;
    }

    public async Task<Appointment?> GetByIdAsync(int appointmentId)
    {
        const string sql = @"
            SELECT appointment_id, center_id, user_id, appointment_date, 
                   appointment_time, status, created_at, updated_at
            FROM appointments
            WHERE appointment_id = @Id
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", appointmentId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapAppointment((MySqlDataReader)reader) : null;
    }

    public async Task<IEnumerable<Appointment>> GetByUserIdAsync(int userId)
    {
        const string sql = @"
            SELECT appointment_id, center_id, user_id, appointment_date, 
                   appointment_time, status, created_at, updated_at
            FROM appointments
            WHERE user_id = @UserId
            ORDER BY appointment_date DESC, appointment_time DESC";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        var list = new List<Appointment>();
        while(await reader.ReadAsync())
        {
            list.Add(MapAppointment((MySqlDataReader)reader));
        }
        return list;
    }

    public async Task<bool> HasConflictAsync(int centerId, DateTime date, TimeSpan time)
    {
        // We consider an exact match in date and time for the same center to be a conflict.
        // Assuming strict time-slot matching for now.
        const string sql = @"
            SELECT 1 
            FROM appointments 
            WHERE center_id = @CenterId 
              AND appointment_date = @Date 
              AND appointment_time = @Time 
              AND status != 'Cancelled'
            LIMIT 1";

        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@CenterId", centerId);
        cmd.Parameters.AddWithValue("@Date", date.Date);
        cmd.Parameters.AddWithValue("@Time", time);

        var result = await cmd.ExecuteScalarAsync();
        return result != null;
    }

    private static Appointment MapAppointment(MySqlDataReader reader)
    {
        return new Appointment
        {
            AppointmentId   = reader.GetInt32(reader.GetOrdinal("appointment_id")),
            CenterId        = reader.GetInt32(reader.GetOrdinal("center_id")),
            UserId          = reader.GetInt32(reader.GetOrdinal("user_id")),
            AppointmentDate = reader.GetDateTime(reader.GetOrdinal("appointment_date")),
            AppointmentTime = (TimeSpan)reader.GetValue(reader.GetOrdinal("appointment_time")),
            Status          = reader.GetString(reader.GetOrdinal("status")),
            CreatedAt       = reader.GetDateTime(reader.GetOrdinal("created_at")),
            UpdatedAt       = reader.IsDBNull(reader.GetOrdinal("updated_at")) ? null : reader.GetDateTime(reader.GetOrdinal("updated_at"))
        };
    }

    public async Task<(int AppointmentId, int TokenId, string ResultCode)> BookAtomicAsync(
        int centerId, int userId, DateTime date, TimeSpan time, string tokenNumber, int capacity)
    {
        await using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();
        
        await using var cmd = new MySqlCommand("sp_book_token", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        // Input parameters
        cmd.Parameters.AddWithValue("@p_center_id", centerId);
        cmd.Parameters.AddWithValue("@p_user_id", userId);
        cmd.Parameters.AddWithValue("@p_date", date.Date);
        cmd.Parameters.AddWithValue("@p_time", time);
        cmd.Parameters.AddWithValue("@p_token_number", tokenNumber);
        cmd.Parameters.AddWithValue("@p_capacity", capacity);

        // Output parameters mapping to SP definition
        var outApptId = new MySqlParameter("@p_appointment_id", MySqlDbType.Int32) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(outApptId);

        var outTokenId = new MySqlParameter("@p_token_id", MySqlDbType.Int32) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(outTokenId);

        var outResultCode = new MySqlParameter("@p_result_code", MySqlDbType.VarChar, 50) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(outResultCode);

        await cmd.ExecuteNonQueryAsync();

        string resultCode = outResultCode.Value?.ToString() ?? "UNKNOWN_ERROR";
        int apptId = outApptId.Value != DBNull.Value ? Convert.ToInt32(outApptId.Value) : 0;
        int tokenId = outTokenId.Value != DBNull.Value ? Convert.ToInt32(outTokenId.Value) : 0;

        return (apptId, tokenId, resultCode);
    }
}
