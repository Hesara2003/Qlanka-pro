using Microsoft.AspNetCore.Mvc;
using QueueLanka.API.DTOs.Auth;
using QueueLanka.API.Services;

namespace QueueLanka.API.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService              _authService;
    private readonly IEmailVerificationService _emailVerification;
    private readonly IPasswordResetService     _passwordReset;

    public AuthController(
        IAuthService              authService,
        IEmailVerificationService emailVerification,
        IPasswordResetService     passwordReset)
    {
        _authService       = authService;
        _emailVerification = emailVerification;
        _passwordReset     = passwordReset;
    }

    /// <summary>Register a new user (citizen, officer, or admin).</summary>
    /// <response code="201">User created successfully.</response>
    /// <response code="400">Validation error.</response>
    /// <response code="409">Username or email already taken.</response>
    /// <response code="422">Invalid role or missing centerId for officer.</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        if (!ModelState.IsValid)
            return UnprocessableEntity(ModelState);

        var result = await _authService.RegisterAsync(dto);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Authenticate a user and receive a JWT access token.</summary>
    /// <response code="200">Login successful; JWT returned.</response>
    /// <response code="400">Validation error.</response>
    /// <response code="401">Invalid username or password.</response>
    /// <response code="403">Account is deactivated.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.LoginAsync(dto);
        return Ok(result);
    }

    /// <summary>Verify a user's email address using the token sent in the verification email.</summary>
    /// <response code="200">Email verified successfully.</response>
    /// <response code="400">Token is invalid, expired, or already used.</response>
    [HttpGet("verify-email")]
    [ProducesResponseType(typeof(VerifyEmailResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { code = "TOKEN_MISSING", message = "Verification token is required." });

        await _emailVerification.VerifyAsync(token);

        return Ok(new VerifyEmailResponseDto
        {
            Message = "Your email has been verified. You can now log in."
        });
    }

    /// <summary>Request a password reset email. Always returns 200 to prevent user enumeration.</summary>
    /// <response code="200">Reset email sent if the address is registered.</response>
    /// <response code="400">Validation error.</response>
    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(PasswordResetResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        await _passwordReset.InitiateResetAsync(dto.Email);

        // Always return the same message regardless of whether the email exists
        return Ok(new PasswordResetResponseDto
        {
            Message = "If that email address is registered, you will receive a password reset link shortly."
        });
    }

    /// <summary>Reset a user's password using a valid reset token.</summary>
    /// <response code="200">Password reset successfully.</response>
    /// <response code="400">Token invalid/expired or validation error.</response>
    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(PasswordResetResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        await _passwordReset.ResetPasswordAsync(dto.Token, dto.NewPassword);

        return Ok(new PasswordResetResponseDto
        {
            Message = "Your password has been reset. You can now log in with your new password."
        });
    }
}
