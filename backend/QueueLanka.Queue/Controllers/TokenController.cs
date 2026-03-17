using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.Services;
using System.Security.Claims;

namespace QueueLanka.Queue.Controllers;

[ApiController]
[Route("api/token")]
[Authorize(Roles = "citizen,officer,admin")] // Allow all authenticated roles for now, usually citizens check tokens
public class TokenController : ControllerBase
{
    private readonly ITokenService _tokenService;

    public TokenController(ITokenService tokenService)
    {
        _tokenService = tokenService;
    }

    /// <summary>
    /// Gets all tokens for the currently authenticated user.
    /// </summary>
    [HttpGet("my-tokens")]
    public async Task<ActionResult<IEnumerable<UserTokenResponseDto>>> GetMyTokens()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new { code = "INVALID_USER", message = "User ID not found in token." });
        }

        var tokens = await _tokenService.GetUserTokensAsync(userId);
        return Ok(tokens);
    }

    /// <summary>
    /// Cancels a specific token for the currently authenticated user.
    /// </summary>
    [HttpPut("{tokenId}/cancel")]
    public async Task<IActionResult> CancelMyToken(int tokenId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new { code = "INVALID_USER", message = "User ID not found in token." });
        }

        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        bool isAdmin = string.Equals(roleClaim, "admin", StringComparison.OrdinalIgnoreCase);

        var result = await _tokenService.CancelTokenAsync(tokenId, userId, isAdmin);

        return result switch
        {
            CancellationResult.Success =>
                Ok(new { message = "Token cancelled successfully." }),

            CancellationResult.AlreadyCancelled =>
                Conflict(new
                {
                    code    = "TOKEN_ALREADY_CANCELLED",
                    message = "This token has already been cancelled."
                }),

            CancellationResult.NotCancellable =>
                UnprocessableEntity(new
                {
                    code    = "TOKEN_NOT_CANCELLABLE",
                    message = "This token cannot be cancelled because it is currently being served, has already been completed, or has been marked as a no-show."
                }),

            _ => // TokenNotFound
                NotFound(new
                {
                    code    = "TOKEN_NOT_FOUND",
                    message = "Token not found or does not belong to your account."
                })
        };
    }
}
