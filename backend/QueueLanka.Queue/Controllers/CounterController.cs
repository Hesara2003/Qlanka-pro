// backend/QueueLanka.Queue/Controllers/CounterController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.DTOs.Common;

namespace QueueLanka.Queue.Controllers;

[ApiController]
[Route("api/counters")]
[Authorize(Roles = "officer,admin")]
public class CounterController : ControllerBase
{
    private readonly ICounterService _counterService;

    public CounterController(ICounterService counterService)
    {
        _counterService = counterService;
    }

    /// <summary>
    /// Calls the next waiting token at the specified counter (FIFO).
    /// Updates the token status to 'Called' and returns its full details.
    /// </summary>
    /// <param name="counterId">ID of the counter calling the next token.</param>
    /// <response code="200">Token successfully called — returns token details.</response>
    /// <response code="400">Counter is closed or does not exist.</response>
    /// <response code="404">No waiting tokens for this counter today.</response>
    [HttpPost("{counterId:int}/call-next")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CallNext(int counterId)
    {
        try
        {
            var calledToken = await _counterService.CallNextTokenAsync(counterId);

            if (calledToken == null)
            {
                return NotFound(new ErrorResponse("NO_WAITING_TOKENS",
                    "There are no waiting tokens for this counter today."));
            }

            return Ok(new ApiResponse<object>(calledToken,
                $"Token {calledToken.TokenNumber} has been called successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse("COUNTER_CLOSED", ex.Message));
        }
    }

    /// <summary>
    /// Updates the status of the currently called token as served or skipped.
    /// </summary>
    /// <param name="counterId">ID of the counter handling the token.</param>
    /// <param name="tokenId">ID of the token to update.</param>
    /// <param name="request">Requested status update payload.</param>
    /// <response code="200">Token status updated successfully.</response>
    /// <response code="400">Invalid status or token not in called state.</response>
    /// <response code="403">Token does not belong to this counter.</response>
    /// <response code="404">Token not found.</response>
    [HttpPut("{counterId:int}/tokens/{tokenId:int}/status")]
    [Authorize(Roles = "officer")]
    [ProducesResponseType(typeof(ApiResponse<UpdateTokenStatusResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTokenStatus(int counterId, int tokenId, [FromBody] UpdateTokenStatusRequestDto request)
    {
        try
        {
            var updated = await _counterService.UpdateTokenStatusAsync(counterId, tokenId, request.Status);

            return Ok(new ApiResponse<UpdateTokenStatusResponseDto>(
                updated,
                $"Token {updated.TokenNumber} status updated to {updated.Status}."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse("TOKEN_NOT_FOUND", ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                new ErrorResponse("TOKEN_COUNTER_MISMATCH", ex.Message));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse("INVALID_STATUS", ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse("INVALID_TOKEN_STATE", ex.Message));
        }
    }
}
