using QueueLanka.Queue.DTOs.Appointment;

namespace QueueLanka.Queue.Services;

public interface IAppointmentService
{
    Task<AppointmentResponseDto> BookTokenAsync(int userId, BookAppointmentRequestDto requestDto);
    Task<IEnumerable<AppointmentResponseDto>> GetUserAppointmentsAsync(int userId);
}
