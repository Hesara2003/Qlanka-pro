using System.ComponentModel.DataAnnotations;

namespace QueueLanka.API.DTOs.Auth;

public class RegisterRequestDto : IValidatableObject
{
    [Required]
    [MinLength(3), MaxLength(50)]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username may only contain letters, digits, and underscores.")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MinLength(8), MaxLength(100)]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$",
        ErrorMessage = "Password must contain uppercase, lowercase, a digit, and a special character.")]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"(?i)^(citizen|officer|admin)$", ErrorMessage = "Role must be one of: citizen, officer, admin.")]
    public string Role { get; set; } = string.Empty;

    // Required for officers; ignored for citizens
    public int? CenterId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!string.Equals(Role, "citizen", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(Role, "officer", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(Role, "admin", StringComparison.OrdinalIgnoreCase))
        {
            yield return new ValidationResult("Role must be one of: citizen, officer, admin.", new[] { nameof(Role) });
        }

        if (string.Equals(Role, "officer", StringComparison.OrdinalIgnoreCase) && (!CenterId.HasValue || CenterId.Value <= 0))
        {
            yield return new ValidationResult("centerId is required for role 'officer'.", new[] { nameof(CenterId) });
        }
    }
}
