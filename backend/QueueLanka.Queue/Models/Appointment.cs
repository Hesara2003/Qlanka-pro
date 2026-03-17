namespace QueueLanka.Queue.Models;

public class Appointment
{
    public int AppointmentId { get; set; }
    public int CenterId { get; set; }
    public int UserId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }
    public string Status { get; set; } = "Scheduled";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
