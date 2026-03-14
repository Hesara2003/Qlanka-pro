namespace QueueLanka.API.DTOs.Appointment;

public class AppointmentResponseDto
{
    public int AppointmentId { get; set; }
    public int CenterId { get; set; }
    public int UserId { get; set; }
    public int? TokenId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
