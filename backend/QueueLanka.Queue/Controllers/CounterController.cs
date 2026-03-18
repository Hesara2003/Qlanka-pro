// QueueLanka.Queue/Controllers/CounterController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
}
