// backend/QueueLanka.Queue/Controllers/CounterController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QueueLanka.Queue.DTOs.Counter;
using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.DTOs.Common;
using QueueLanka.Shared.Extensions;
using System.ComponentModel.DataAnnotations;

namespace QueueLanka.Queue.Controllers;

[ApiController]
[Route("api/counters")]
[ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
[ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
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
    [Authorize(Roles = "officer")]
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

    /// <summary>
    /// Reassigns a token from a source counter to a target counter.
    /// </summary>
    /// <param name="counterId">Source counter id.</param>
    /// <param name="request">Token reassignment request payload.</param>
    /// <response code="200">Token reassigned successfully.</response>
    /// <response code="400">Invalid state, invalid payload, or target counter is closed.</response>
    /// <response code="403">Token does not belong to source counter.</response>
    /// <response code="404">Token or target counter not found.</response>
    [HttpPost("{counterId:int}/tokens/reassign")]
    [Authorize(Roles = "officer,admin")]
    [ProducesResponseType(typeof(ApiResponse<ReassignTokenResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReassignToken(int counterId, [FromBody] ReassignTokenRequestDto request)
    {
        if (!TryGetUserId(out var performedByUserId, out var forbiddenResult))
        {
            return forbiddenResult;
        }

        try
        {
            var response = await _counterService.ReassignTokenAsync(
                counterId,
                request.TokenId,
                request.TargetCounterId,
                request.Reason,
                performedByUserId);

            return Ok(new ApiResponse<ReassignTokenResponseDto>(
                response,
                $"Token {response.TokenNumber} reassigned from counter {response.SourceCounterId} to {response.TargetCounterId}."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse("RESOURCE_NOT_FOUND", ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                new ErrorResponse("TOKEN_COUNTER_MISMATCH", ex.Message));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse("INVALID_REQUEST", ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse("INVALID_TOKEN_STATE", ex.Message));
        }
    }

    /// <summary>
    /// Returns dashboard data for the specified counter.
    /// </summary>
    /// <param name="counterId">Counter id.</param>
    /// <response code="200">Dashboard returned successfully.</response>
    /// <response code="403">Officer is not assigned to this counter.</response>
    /// <response code="404">Counter not found.</response>
    [HttpGet("{counterId:int}/dashboard")]
    [Authorize(Roles = "officer")]
    [ProducesResponseType(typeof(ApiResponse<CounterDashboardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDashboard(int counterId)
    {
        if (!TryGetUserId(out var officerUserId, out var forbiddenResult))
        {
            return forbiddenResult;
        }

        try
        {
            var dashboard = await _counterService.GetDashboardAsync(counterId, officerUserId);
            return Ok(new ApiResponse<CounterDashboardDto>(dashboard, "Counter dashboard retrieved successfully."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse("COUNTER_NOT_FOUND", ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                new ErrorResponse("FORBIDDEN", ex.Message));
        }
    }

    /// <summary>
    /// Returns waiting tokens for the specified counter.
    /// </summary>
    /// <param name="counterId">Counter id.</param>
    /// <response code="200">Waiting tokens returned successfully.</response>
    /// <response code="403">Officer is not assigned to this counter.</response>
    /// <response code="404">Counter not found.</response>
    [HttpGet("{counterId:int}/tokens/waiting")]
    [Authorize(Roles = "officer")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<WaitingTokenDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWaitingTokens(int counterId)
    {
        if (!TryGetUserId(out var officerUserId, out var forbiddenResult))
        {
            return forbiddenResult;
        }

        try
        {
            var waitingTokens = await _counterService.GetWaitingTokensAsync(counterId, officerUserId);
            return Ok(new ApiResponse<IReadOnlyList<WaitingTokenDto>>(waitingTokens, "Waiting tokens retrieved successfully."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse("COUNTER_NOT_FOUND", ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                new ErrorResponse("FORBIDDEN", ex.Message));
        }
    }

    /// <summary>
    /// Returns today's served/skipped/average service-time stats for the specified counter.
    /// </summary>
    /// <param name="counterId">Counter id.</param>
    /// <response code="200">Counter stats returned successfully.</response>
    /// <response code="404">Counter not found.</response>
    [HttpGet("{counterId:int}/stats")]
    [Authorize(Roles = "officer,admin")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCounterStats(int counterId)
    {
        var role = User.GetRole();
        var officerUserId = string.Equals(role, "officer", StringComparison.OrdinalIgnoreCase)
            ? User.GetUserId()
            : 0;

        if (string.Equals(role, "officer", StringComparison.OrdinalIgnoreCase) && officerUserId <= 0)
        {
            return ForbiddenIdentityResult();
        }

        try
        {
            var dashboard = await _counterService.GetDashboardAsync(counterId, officerUserId);

            var stats = new
            {
                dashboard.ServedCount,
                dashboard.SkippedCount,
                dashboard.AverageServiceTimeSeconds
            };

            return Ok(new ApiResponse<object>(stats, "Counter stats retrieved successfully."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse("COUNTER_NOT_FOUND", ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                new ErrorResponse("FORBIDDEN", ex.Message));
        }
    }

    [HttpPost("/api/admin/centers/{centerId:int}/counters")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<CounterResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateCounter(int centerId, [FromBody] CreateCounterRequestDto request)
    {
        if (!TryGetUserId(out var adminUserId, out var forbiddenResult))
        {
            return forbiddenResult;
        }

        request.CenterId = centerId;

        try
        {
            var created = await _counterService.CreateCounterAsync(request, adminUserId);
            var location = $"/api/admin/centers/{centerId}/counters/{created.CounterId}";
            return Created(location, new ApiResponse<CounterResponseDto>(created, "Counter created successfully."));
        }
        catch (ValidationException ex)
        {
            return BadRequest(new ErrorResponse("VALIDATION_ERROR", ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse("CENTER_NOT_FOUND", ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ErrorResponse("COUNTER_NAME_CONFLICT", ex.Message));
        }
    }

    [HttpGet("/api/admin/centers/{centerId:int}/counters")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<ListCountersResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCountersByCenter(int centerId)
    {
        if (!TryGetUserId(out var adminUserId, out var forbiddenResult))
        {
            return forbiddenResult;
        }

        try
        {
            var response = await _counterService.GetCountersByCenterAsync(centerId, adminUserId);
            return Ok(new ApiResponse<ListCountersResponseDto>(response, "Counters retrieved successfully."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse("CENTER_NOT_FOUND", ex.Message));
        }
    }

    [HttpGet("/api/admin/centers/{centerId:int}/counters/{counterId:int}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<CounterResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCounterById(int centerId, int counterId)
    {
        if (!TryGetUserId(out var adminUserId, out var forbiddenResult))
        {
            return forbiddenResult;
        }

        try
        {
            var counter = await _counterService.GetCounterByIdAsync(centerId, counterId, adminUserId);
            return Ok(new ApiResponse<CounterResponseDto>(counter, "Counter retrieved successfully."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse("COUNTER_NOT_FOUND", ex.Message));
        }
    }

    [HttpPatch("/api/admin/centers/{centerId:int}/counters/{counterId:int}/status")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<CounterResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCounterStatus(int centerId, int counterId, [FromBody] UpdateCounterStatusRequestDto request)
    {
        if (!TryGetUserId(out var adminUserId, out var forbiddenResult))
        {
            return forbiddenResult;
        }

        try
        {
            var updated = await _counterService.UpdateCounterStatusAsync(centerId, counterId, request, adminUserId);
            var message = string.IsNullOrWhiteSpace(updated.WarningMessage)
                ? "Counter status updated successfully."
                : $"Counter status updated with warning: {updated.WarningMessage}";

            return Ok(new ApiResponse<CounterResponseDto>(updated, message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(new ErrorResponse("VALIDATION_ERROR", ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse("COUNTER_NOT_FOUND", ex.Message));
        }
    }

    private bool TryGetUserId(out int userId, out IActionResult forbiddenResult)
    {
        userId = User.GetUserId();
        if (userId > 0)
        {
            forbiddenResult = null!;
            return true;
        }

        forbiddenResult = ForbiddenIdentityResult();
        return false;
    }

    private ObjectResult ForbiddenIdentityResult()
    {
        return StatusCode(StatusCodes.Status403Forbidden,
            new ErrorResponse("FORBIDDEN", "User identity is invalid."));
    }
}
