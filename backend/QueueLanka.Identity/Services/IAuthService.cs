using QueueLanka.Identity.DTOs.Auth;

namespace QueueLanka.Identity.Services;

public interface IAuthService
{
    Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto dto);
    Task<LoginResponseDto> LoginAsync(LoginRequestDto dto);
}
