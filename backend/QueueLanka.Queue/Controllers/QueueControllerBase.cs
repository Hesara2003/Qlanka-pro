using Microsoft.AspNetCore.Mvc;
using QueueLanka.Shared.DTOs.Common;
using QueueLanka.Shared.Extensions;

namespace QueueLanka.Queue.Controllers;

public abstract class QueueControllerBase : ControllerBase
{
    protected bool TryGetAuthenticatedUserId(out int userId, out IActionResult unauthorizedResult, string errorCode = "INVALID_TOKEN")
    {
        userId = User.GetUserId();
        if (userId > 0)
        {
            unauthorizedResult = null!;
            return true;
        }

        unauthorizedResult = Unauthorized(new ErrorResponse(errorCode, "Invalid user token."));
        return false;
    }
}
