
using System;
using QueueLanka.Shared.DTOs.Common;

namespace QueueLanka.Shared.Events;

public class BookingConfirmedEvent
{
    public int UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int AppointmentId { get; set; }
    public int TokenId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public int CenterId { get; set; }
    public string CenterName { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }
}

