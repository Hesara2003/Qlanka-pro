using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QueueLanka.Shared.DTOs.Common;
using QueueLanka.Identity.DTOs.User;
using QueueLanka.Shared.Exceptions;
using QueueLanka.Identity.Extensions;
using QueueLanka.Identity.Services;

namespace QueueLanka.Identity.Controllers;

/// <summary>
/// Admin user management endpoints — SCRUM-78/83.
/// All routes require a valid JWT with the "admin" role.
/// </summary>
[ApiController]
[Route("api/admin/users")]
[Produces("application/json")]
[Authorize(Roles = "admin")]
public class AdminUserController : ControllerBase
{
    private static readonly HashSet<string> _validRoles =
        new(StringComparer.OrdinalIgnoreCase) { "citizen", "officer", "admin" };

    private readonly IUserManagementService _userManagement;
    private readonly ILogger<AdminUserController> _logger;

    public AdminUserController(
        IUserManagementService userManagement,
        ILogger<AdminUserController> logger)
    {
        _userManagement = userManagement;
        _logger         = logger;
    }

    // ── GET /api/admin/users ─────────────────────────────────────────────

    /// <summary>List all non-deleted users (admin only).</summary>
    /// <param name="role">Optional role filter: citizen | officer | admin</param>
    /// <param name="isActive">Optional active-status filter</param>
    /// <response code="200">User list returned successfully.</response>
    /// <response code="400">Invalid role filter value supplied.</response>
    /// <response code="401">Missing or invalid JWT.</response>
    /// <response code="403">Authenticated user is not an admin.</response>
    /// <response code="500">Unexpected server or data-access error.</response>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AdminUserDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? role     = null,
        [FromQuery] bool?   isActive = null)
    {
        if (role is not null && !_validRoles.Contains(role))
        {
            _logger.LogWarning("Admin {AdminId} supplied invalid role filter: {Role}", User.GetUserId(), role);
            throw new InvalidUserRoleFilterException(role);
        }

        _logger.LogInformation(
            "Admin {AdminId} requested user list (role={Role}, isActive={IsActive})",
            User.GetUserId(), role, isActive);

        var users     = await _userManagement.GetUsersAsync(role, isActive);
        var usersList = users.ToList();

        var response = new ApiResponse<IEnumerable<AdminUserDto>>(
            usersList,
            new ResponseMetadata
            {
                TotalCount    = usersList.Count,
                CorrelationId = HttpContext.TraceIdentifier
            },
            $"Retrieved {usersList.Count} user(s)"
        );

        return Ok(response);
    }

    // ── DELETE /api/admin/users/{id} ─────────────────────────────────────

    /// <summary>Soft-delete a user account (admin only).</summary>
    /// <param name="id">ID of the user to delete.</param>
    /// <response code="200">User deleted successfully.</response>
    /// <response code="400">Supplied user ID is not a positive integer.</response>
    /// <response code="401">Missing or invalid JWT.</response>
    /// <response code="403">Not an admin, or attempting to delete another admin.</response>
    /// <response code="404">User not found or already deleted.</response>
    /// <response code="500">Unexpected server or data-access error.</response>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteUser(int id)
    {
        if (id <= 0)
        {
            _logger.LogWarning("Admin {AdminId} supplied invalid user ID: {UserId}", User.GetUserId(), id);
            throw new InvalidUserIdException(id);
        }

        var requestingAdminId = User.GetUserId();

        _logger.LogInformation(
            "Admin {AdminId} requested deletion of user {UserId}",
            requestingAdminId, id);

        await _userManagement.DeleteUserAsync(id, requestingAdminId);

        var response = new ApiResponse<object?>(
            null,
            new ResponseMetadata { CorrelationId = HttpContext.TraceIdentifier },
            $"User {id} has been deleted successfully"
        );

        return Ok(response);
    }
}
