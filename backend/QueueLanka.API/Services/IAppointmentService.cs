using QueueLanka.API.DTOs.Appointment;

namespace QueueLanka.API.Services;

public interface IAppointmentService
{
    Task<AppointmentResponseDto> BookTokenAsync(int userId, BookAppointmentRequestDto requestDto);
    Task<IEnumerable<AppointmentResponseDto>> GetUserAppointmentsAsync(int userId);
}
