using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public interface IAppointmentRepository
{
    Task<Appointment> CreateAsync(Appointment appointment);
    Task<Appointment?> GetByIdAsync(int appointmentId);
    Task<IEnumerable<Appointment>> GetByUserIdAsync(int userId);
    Task<bool> HasConflictAsync(int centerId, DateTime date, TimeSpan time);
    
    /// <summary>
    /// Executes the <c>sp_book_token</c> stored procedure to atomically check constraints
    /// and create both Appointment and Token records within a single transaction.
    /// Returns the identities and any error code from the database logic.
    /// </summary>
    Task<(int AppointmentId, int TokenId, string ResultCode)> BookAtomicAsync(
        int centerId, int userId, DateTime date, TimeSpan time, string tokenNumber, int capacity);
}
