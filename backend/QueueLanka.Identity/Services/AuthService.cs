using Microsoft.IdentityModel.Tokens;
using QueueLanka.Identity.Data;
using QueueLanka.Identity.DTOs.Auth;
using QueueLanka.Shared.Exceptions;
using QueueLanka.Identity.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace QueueLanka.Identity.Services;

public class AuthService : IAuthService
{
    private static readonly HashSet<string> ValidRoles = ["citizen", "officer", "admin"];

    private readonly IUserRepository              _users;
    private readonly IEmailVerificationService    _emailVerification;
    private readonly IConfiguration               _config;

    public AuthService(IUserRepository users, IEmailVerificationService emailVerification, IConfiguration config)
    {
        _users             = users;
        _emailVerification = emailVerification;
        _config            = config;
    }

    // ── Register ───────────────────────────────────────────────
    public async Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto dto)
    {
        // Validate role
        if (!ValidRoles.Contains(dto.Role.ToLower()))
            throw new AppException(422, "INVALID_ROLE", "Role must be one of: citizen, officer, admin.");

        // Officers must specify a valid centre
        if (dto.Role.Equals("officer", StringComparison.OrdinalIgnoreCase))
        {
            if (dto.CenterId is null)
                throw new AppException(422, "CENTER_REQUIRED", "centerId is required for role 'officer'.");

            if (dto.CenterId <= 0)
                throw new AppException(422, "INVALID_CENTER", "centerId must be greater than 0 for role 'officer'.");
        }

        // Check uniqueness
        if (await _users.GetByUsernameAsync(dto.Username) is not null)
            throw new DuplicateUsernameException(dto.Username);

        if (await _users.GetByEmailAsync(dto.Email) is not null)
            throw new DuplicateEmailException(dto.Email);

        // Hash password — work factor 12
        var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12);

        var user = new User
        {
            Username     = dto.Username,
            Email        = dto.Email,
            PasswordHash = hash,
            Role         = dto.Role.ToLower(),
            CenterId     = dto.Role.Equals("officer", StringComparison.OrdinalIgnoreCase) ? dto.CenterId : null
        };

        var userId = await _users.CreateAsync(user);

        // Email verification disabled — users are auto-verified on registration
        // await _emailVerification.SendVerificationAsync(userId, user.Email, user.Username);

        return new RegisterResponseDto
        {
            UserId   = userId,
            Username = user.Username,
            Role     = user.Role
        };
    }

    // ── Login ──────────────────────────────────────────────────
    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto dto)
    {
        var user = await _users.GetByUsernameAsync(dto.Username);

        // Always use the same generic message — don't reveal which field failed
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new InvalidCredentialsException();

        // Email verification disabled
        // if (!user.IsEmailVerified)
        //     throw new EmailNotVerifiedException();

        if (!user.IsActive)
            throw new AccountDisabledException();

        var accessToken  = GenerateJwt(user);
        var refreshToken = GenerateRefreshToken();
        var expiryMins   = _config.GetValue<int>("Jwt:AccessTokenExpiryMinutes");

        return new LoginResponseDto
        {
            Token        = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn    = expiryMins * 60,
            Role         = user.Role.ToLowerInvariant(),
            CounterId    = null
        };
    }

    // ── Private helpers ────────────────────────────────────────
    private string GenerateJwt(User user)
    {
        var secret   = _config["Jwt:Secret"]!;
        var issuer   = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];
        var expiryMins = _config.GetValue<int>("Jwt:AccessTokenExpiryMinutes");

        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,      user.UserId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(ClaimTypes.Role,                  user.Role),
            new(JwtRegisteredClaimNames.Jti,      Guid.NewGuid().ToString())
        };

        if (user.CenterId.HasValue)
            claims.Add(new Claim("centerId", user.CenterId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer:             issuer,
            audience:           audience,
            claims:             claims,
            notBefore:          DateTime.UtcNow,
            expires:            DateTime.UtcNow.AddMinutes(expiryMins),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }
}
