namespace QueueLanka.API.DTOs.Auth;

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public string Role { get; set; } = string.Empty;
    public int? CounterId { get; set; }
}
