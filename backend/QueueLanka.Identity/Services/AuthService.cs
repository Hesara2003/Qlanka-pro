using QueueLanka.Identity.Data;
using QueueLanka.Identity.DTOs.Auth;
using QueueLanka.Shared.Exceptions;
using QueueLanka.Identity.Models;

namespace QueueLanka.Identity.Services;

public class AuthService : IAuthService
{
    private static readonly HashSet<string> ValidRoles = ["citizen", "officer", "admin"];

    private readonly IUserRepository              _users;
    private readonly IEmailVerificationService    _emailVerification;
    private readonly IConfiguration               _config;
    private readonly IWso2IdentityService          _wso2;

    public AuthService(
        IUserRepository users,
        IEmailVerificationService emailVerification,
        IConfiguration config,
        IWso2IdentityService wso2)
    {
        _users             = users;
        _emailVerification = emailVerification;
        _config            = config;
        _wso2              = wso2;
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

        // Provision the user into WSO2 IS via SCIM2.
        // This is non-blocking: a failure is logged but does NOT roll back the MySQL record.
        // Operators can re-sync manually using the SCIM2 API if needed.
        await _wso2.ProvisionUserAsync(
            username: user.Username,
            password: dto.Password,   // raw password needed for WSO2 SCIM2 provisioning
            email:    user.Email,
            role:     user.Role,
            centerId: user.CenterId);

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

        // Step 1: Local credential check (BCrypt) — defence-in-depth.
        // This prevents unnecessary ROPC calls to WSO2 IS for known-bad credentials
        // and ensures the account exists and is active before we hit the IdP.
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new InvalidCredentialsException();

        if (!user.IsActive)
            throw new AccountDisabledException();

        // Step 2: Exchange credentials with WSO2 IS via ROPC.
        // WSO2 IS is the authoritative token issuer; its access token is returned to the client.
        var wso2Result = await _wso2.GetTokenAsync(dto.Username, dto.Password);

        // Step 3: For officers, look up their assigned counter from the queue database.
        int? counterId = null;
        if (user.Role.Equals("officer", StringComparison.OrdinalIgnoreCase))
        {
            var identityConnStr = _config.GetConnectionString("Default");
            if (!string.IsNullOrEmpty(identityConnStr))
            {
                var queueConnStr = identityConnStr.Replace("identity_db", "queue_db");
                using var conn = new MySqlConnector.MySqlConnection(queueConnStr);
                await conn.OpenAsync();
                const string sql = "SELECT counter_id FROM queue_db.counters WHERE assigned_officer_user_id = @UserId LIMIT 1";
                counterId = await Dapper.SqlMapper.QueryFirstOrDefaultAsync<int?>(conn, sql, new { UserId = user.UserId });
            }
        }

        return new LoginResponseDto
        {
            Token        = wso2Result.AccessToken,
            RefreshToken = wso2Result.RefreshToken,
            ExpiresIn    = wso2Result.ExpiresIn,
            Role         = user.Role.ToLowerInvariant(),
            CounterId    = counterId
        };
    }

}
