using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Identity.DTOs.Auth;

public class RegisterRequestDto
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
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;

    // Required for officers; ignored for citizens
    public int? CenterId { get; set; }
}
