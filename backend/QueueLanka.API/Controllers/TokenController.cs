using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QueueLanka.API.DTOs.Token;
using QueueLanka.API.Services;
using System.Security.Claims;

namespace QueueLanka.API.Controllers;

[ApiController]
[Route("api/[controller]")]
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

        var success = await _tokenService.CancelTokenAsync(tokenId, userId);
        
        if (!success)
        {
            return BadRequest(new { message = "Token could not be cancelled. It may not exist, belong to you, or is no longer waiting." });
        }

        return Ok(new { message = "Token cancelled successfully." });
    }
}
