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
    private readonly IWso2IdentityService         _wso2Identity;
    private readonly IConfiguration               _config;

    public AuthService(
        IUserRepository users,
        IEmailVerificationService emailVerification,
        IWso2IdentityService wso2Identity,
        IConfiguration config)
    {
        _users             = users;
        _emailVerification = emailVerification;
        _wso2Identity      = wso2Identity;
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

        if (IsWso2Enabled())
        {
            await _wso2Identity.ProvisionUserAsync(
                user.Username,
                dto.Password,
                user.Email,
                user.Role,
                user.CenterId);
        }

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

        if (user is null)
            throw new InvalidCredentialsException();

        Wso2TokenResult? wso2Token = null;
        if (IsWso2Enabled())
        {
            // Delegate credential validation and token issuance to WSO2 when enabled.
            wso2Token = await _wso2Identity.RequestTokenAsync(dto.Username, dto.Password);
        }
        else
        {
            // Local fallback preserves compatibility for environments without WSO2.
            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                throw new InvalidCredentialsException();
        }

        // Email verification disabled
        // if (!user.IsEmailVerified)
        //     throw new EmailNotVerifiedException();

        if (!user.IsActive)
            throw new AccountDisabledException();

        var expiryMins = _config.GetValue<int>("Jwt:AccessTokenExpiryMinutes");

        int? counterId = null;
        if (user.Role.Equals("officer", StringComparison.OrdinalIgnoreCase))
        {
            var identityConnStr = _config.GetConnectionString("Default");
            if (!string.IsNullOrEmpty(identityConnStr))
            {
                var queueConnStr = identityConnStr.Replace("identity_db", "queue_db");
                using var conn = new MySqlConnector.MySqlConnection(queueConnStr);
                await conn.OpenAsync();
                var sql = "SELECT counter_id FROM queue_db.counters WHERE assigned_officer_user_id = @UserId LIMIT 1";
                counterId = await Dapper.SqlMapper.QueryFirstOrDefaultAsync<int?>(conn, sql, new { UserId = user.UserId });
            }
        }

        return new LoginResponseDto
        {
            Token        = wso2Token?.AccessToken ?? GenerateJwt(user),
            RefreshToken = wso2Token?.RefreshToken ?? GenerateRefreshToken(),
            ExpiresIn    = wso2Token?.ExpiresIn ?? expiryMins * 60,
            Role         = user.Role.ToLowerInvariant(),
            CounterId    = counterId
        };
    }

    private bool IsWso2Enabled()
        => _config.GetValue<bool?>("Wso2:Enabled") ?? false;

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
