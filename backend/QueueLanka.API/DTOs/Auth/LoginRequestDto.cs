using System.ComponentModel.DataAnnotations;

namespace QueueLanka.API.DTOs.Auth;

public class LoginRequestDto
{
    [Required]
    [MinLength(3), MaxLength(50)]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username may only contain letters, digits, and underscores.")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MinLength(8), MaxLength(100)]
    public string Password { get; set; } = string.Empty;
}
