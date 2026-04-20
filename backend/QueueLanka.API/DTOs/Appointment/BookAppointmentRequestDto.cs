using System.ComponentModel.DataAnnotations;

namespace QueueLanka.API.DTOs.Appointment;

public class BookAppointmentRequestDto : IValidatableObject
{
    [Range(1, int.MaxValue, ErrorMessage = "CenterId must be greater than zero.")]
    public int CenterId { get; set; }

    [Required]
    public DateTime AppointmentDate { get; set; }

    [Required]
    public TimeSpan AppointmentTime { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (CenterId <= 0)
        {
            yield return new ValidationResult("CenterId must be greater than zero.", new[] { nameof(CenterId) });
        }

        if (AppointmentDate == default)
        {
            yield return new ValidationResult("AppointmentDate is required.", new[] { nameof(AppointmentDate) });
        }

        if (AppointmentTime == default)
        {
            yield return new ValidationResult("AppointmentTime is required.", new[] { nameof(AppointmentTime) });
        }
    }
}
