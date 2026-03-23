using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using QueueLanka.Shared.DTOs.Common;

namespace QueueLanka.Shared.Filters;

/// <summary>
/// Action filter to automatically handle model validation errors - SCRUM-29
/// </summary>
public class ValidationFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            var validationErrors = new List<ValidationError>();

            foreach (var (key, value) in context.ModelState)
            {
                foreach (var error in value.Errors)
                {
                    validationErrors.Add(new ValidationError
                    {
                        Field = key,
                        Message = error.ErrorMessage,
                        RejectedValue = value.AttemptedValue
                    });
                }
            }

            var errorResponse = new ErrorResponse
            {
                Code = "VALIDATION_ERROR",
                Message = "One or more validation errors occurred",
                ValidationErrors = validationErrors,
                Timestamp = DateTime.UtcNow,
                Path = context.HttpContext.Request.Path,
                CorrelationId = context.HttpContext.TraceIdentifier
            };

            context.Result = new BadRequestObjectResult(errorResponse);
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // No action needed after execution
    }
}
