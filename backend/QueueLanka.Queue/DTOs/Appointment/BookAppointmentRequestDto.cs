using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.DTOs.Appointment;

public class BookAppointmentRequestDto
{
    [Required]
    public int CenterId { get; set; }

    [Required]
    public DateTime AppointmentDate { get; set; }

    [Required]
    public TimeSpan AppointmentTime { get; set; }
}
