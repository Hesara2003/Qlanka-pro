using Microsoft.AspNetCore.Mvc;
using QueueLanka.API.DTOs.Common;
using QueueLanka.API.Extensions;

namespace QueueLanka.API.Controllers;

public abstract class ApiControllerBase : ControllerBase
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
