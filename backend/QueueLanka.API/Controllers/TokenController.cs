using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QueueLanka.API.DTOs.Common;
using QueueLanka.API.DTOs.Token;
using QueueLanka.API.Extensions;
using QueueLanka.API.Services;

namespace QueueLanka.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "citizen,officer,admin")] // Allow all authenticated roles for now, usually citizens check tokens
public class TokenController : ApiControllerBase
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
    public async Task<IActionResult> GetMyTokens()
    {
        if (!TryGetAuthenticatedUserId(out var userId, out var unauthorizedResult, "INVALID_USER"))
        {
            return unauthorizedResult;
        }

        var tokens = await _tokenService.GetUserTokensAsync(userId);
        return Ok(new ApiResponse<IEnumerable<UserTokenResponseDto>>(
            tokens,
            new ResponseMetadata { CorrelationId = HttpContext.TraceIdentifier },
            "Tokens retrieved successfully."));
    }

    /// <summary>
    /// Cancels a specific token for the currently authenticated user.
    /// </summary>
    [HttpPut("{tokenId}/cancel")]
    public async Task<IActionResult> CancelMyToken(int tokenId)
    {
        if (!TryGetAuthenticatedUserId(out var userId, out var unauthorizedResult, "INVALID_USER"))
        {
            return unauthorizedResult;
        }

        var isAdmin = string.Equals(User.GetRole(), "admin", StringComparison.OrdinalIgnoreCase);

        var result = await _tokenService.CancelTokenAsync(tokenId, userId, isAdmin);

        return result switch
        {
            CancellationResult.Success =>
                Ok(new ApiResponse<object>(
                    new { tokenId },
                    new ResponseMetadata { CorrelationId = HttpContext.TraceIdentifier },
                    "Token cancelled successfully.")),

            CancellationResult.AlreadyCancelled =>
                Conflict(new ErrorResponse("TOKEN_ALREADY_CANCELLED", "This token has already been cancelled.")),

            CancellationResult.NotCancellable =>
                UnprocessableEntity(new ErrorResponse(
                    "TOKEN_NOT_CANCELLABLE",
                    "This token cannot be cancelled because it is currently being served, has already been completed, or has been marked as a no-show.")),

            _ => // TokenNotFound
                NotFound(new ErrorResponse("TOKEN_NOT_FOUND", "Token not found or does not belong to your account."))
        };
    }
}
