using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public interface IAppointmentRepository
{
    Task<Appointment> CreateAsync(Appointment appointment);
    Task<Appointment?> GetByIdAsync(int appointmentId);
    Task<IEnumerable<Appointment>> GetByUserIdAsync(int userId);
    Task<bool> HasConflictAsync(int centerId, DateTime date, TimeSpan time);
}
