using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QueueLanka.Shared.DTOs.Common;
using QueueLanka.ServiceCenter.DTOs.ServiceCenter;
using QueueLanka.Shared.Exceptions;
using QueueLanka.ServiceCenter.Services;

namespace QueueLanka.ServiceCenter.Controllers;

/// <summary>
/// Service Center API endpoints with standardized error handling - SCRUM-29
/// </summary>
[ApiController]
[Route("api/service-centers")]
[Produces("application/json")]
public class ServiceCenterController : ControllerBase
{
    private readonly IServiceCenterService _serviceCenterService;
    private readonly ILogger<ServiceCenterController> _logger;

    public ServiceCenterController(
        IServiceCenterService serviceCenterService,
        ILogger<ServiceCenterController> logger)
    {
        _serviceCenterService = serviceCenterService;
        _logger = logger;
    }

    /// <summary>Get all service centers with availability information.</summary>
    /// <remarks>
    /// Returns a list of all service centers including their real-time availability status.
    /// The response includes metadata such as total count and timestamp.
    /// </remarks>
    /// <response code="200">Service centers retrieved successfully</response>
    /// <response code="500">Internal server error occurred</response>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ServiceCenterDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllServiceCenters()
    {
        _logger.LogInformation("Fetching all service centers");
        
        var centers = await _serviceCenterService.GetAllServiceCentersAsync();
        var centersList = centers.ToList();
        
        var response = new ApiResponse<IEnumerable<ServiceCenterDto>>(
            centersList,
            new ResponseMetadata
            {
                TotalCount = centersList.Count,
                CorrelationId = HttpContext.TraceIdentifier
            },
            $"Retrieved {centersList.Count} service center(s)"
        );

        return Ok(response);
    }

    /// <summary>Get a specific service center by ID.</summary>
    /// <param name="id">The service center ID</param>
    /// <remarks>
    /// Returns detailed information about a specific service center.
    /// If the service center is not found, a 404 error is returned.
    /// </remarks>
    /// <response code="200">Service center retrieved successfully</response>
    /// <response code="400">Invalid service center ID provided</response>
    /// <response code="404">Service center not found</response>
    /// <response code="500">Internal server error occurred</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ServiceCenterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetServiceCenterById(int id)
    {
        // Validate input
        if (id <= 0)
        {
            _logger.LogWarning("Invalid service center ID requested: {Id}", id);
            throw new InvalidServiceCenterDataException("Service center ID must be greater than zero");
        }

        _logger.LogInformation("Fetching service center with ID: {CenterId}", id);
        
        var center = await _serviceCenterService.GetServiceCenterByIdAsync(id);
        
        if (center == null)
        {
            _logger.LogWarning("Service center not found: {CenterId}", id);
            throw new ServiceCenterNotFoundException(id);
        }

        var response = new ApiResponse<ServiceCenterDto>(
            center,
            new ResponseMetadata
            {
                CorrelationId = HttpContext.TraceIdentifier
            },
            "Service center retrieved successfully"
        );

        return Ok(response);
    }

    /// <summary>Check if a service center is currently available.</summary>
    /// <param name="id">The service center ID</param>
    /// <remarks>
    /// Returns a boolean indicating whether the service center is currently available for service.
    /// This considers both the center's active status and its availability schedule.
    /// </remarks>
    /// <response code="200">Availability status retrieved successfully</response>
    /// <response code="400">Invalid service center ID provided</response>
    /// <response code="404">Service center not found</response>
    [HttpGet("{id}/availability")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckAvailability(int id)
    {
        if (id <= 0)
        {
            throw new InvalidServiceCenterDataException("Service center ID must be greater than zero");
        }

        var center = await _serviceCenterService.GetServiceCenterByIdAsync(id);
        
        if (center == null)
        {
            throw new ServiceCenterNotFoundException(id);
        }

        var isAvailable = center.IsAvailable && center.IsActive;
        
        var response = new ApiResponse<bool>(
            isAvailable,
            new ResponseMetadata { CorrelationId = HttpContext.TraceIdentifier },
            isAvailable ? "Service center is currently available" : "Service center is currently unavailable"
        );

        return Ok(response);
    }

    /// <summary>Create a new service center.</summary>
    /// <remarks>
    /// Creates a new service center with the provided details and automatically seeds a default
    /// Monday–Friday operating schedule using the supplied opening and closing times.
    /// Saturday and Sunday are seeded as closed by default.
    ///
    /// **Requires Admin role.**
    /// </remarks>
    /// <param name="request">Service center creation payload.</param>
    /// <response code="201">Service center created successfully</response>
    /// <response code="400">Validation error in the request body</response>
    /// <response code="401">Authentication required</response>
    /// <response code="403">Admin role required</response>
    /// <response code="409">A service center with the same name and address already exists</response>
    /// <response code="500">Internal server error occurred</response>
    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<ServiceCenterDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateServiceCenter([FromBody] CreateServiceCenterRequestDto request)
    {
        _logger.LogInformation("Admin creating service center: {Name} at {Address}", request.Name, request.Address);

        var created = await _serviceCenterService.CreateServiceCenterAsync(request);

        var response = new ApiResponse<ServiceCenterDto>(
            created,
            new ResponseMetadata { CorrelationId = HttpContext.TraceIdentifier },
            $"Service center \"{created.Name}\" created successfully."
        );

        return CreatedAtAction(
            nameof(GetServiceCenterById),
            new { id = created.CenterId },
            response
        );
    }

    /// <summary>Get the structured location record for a service center.</summary>
    /// <param name="id">The service center ID</param>
    /// <response code="200">Location record retrieved successfully</response>
    /// <response code="400">Invalid service center ID provided</response>
    /// <response code="404">Service center or location record not found</response>
    /// <response code="500">Internal server error occurred</response>
    [HttpGet("{id}/location")]
    [ProducesResponseType(typeof(ApiResponse<CenterLocationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetLocation(int id)
    {
        if (id <= 0)
            throw new InvalidServiceCenterDataException("Service center ID must be greater than zero.");

        _logger.LogInformation("Fetching location for service center {CenterId}", id);

        var location = await _serviceCenterService.GetLocationAsync(id);

        var response = new ApiResponse<CenterLocationDto>(
            location,
            new ResponseMetadata { CorrelationId = HttpContext.TraceIdentifier },
            "Location retrieved successfully."
        );

        return Ok(response);
    }

    /// <summary>Create or update the structured location record for a service center.</summary>
    /// <param name="id">The service center ID</param>
    /// <param name="request">Location upsert payload</param>
    /// <remarks>
    /// Inserts a new <c>center_locations</c> row or updates it if one already exists.
    /// Latitude and Longitude must be supplied together or not at all.
    ///
    /// **Requires Admin role.**
    /// </remarks>
    /// <response code="200">Location upserted successfully</response>
    /// <response code="400">Validation error or mismatched coordinate pair</response>
    /// <response code="401">Authentication required</response>
    /// <response code="403">Admin role required</response>
    /// <response code="404">Service center not found</response>
    /// <response code="500">Internal server error occurred</response>
    [HttpPut("{id}/location")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<CenterLocationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpsertLocation(int id, [FromBody] UpsertLocationRequestDto request)
    {
        if (id <= 0)
            throw new InvalidServiceCenterDataException("Service center ID must be greater than zero.");

        _logger.LogInformation("Admin upserting location for service center {CenterId}", id);

        var location = await _serviceCenterService.UpsertLocationAsync(id, request);

        var response = new ApiResponse<CenterLocationDto>(
            location,
            new ResponseMetadata { CorrelationId = HttpContext.TraceIdentifier },
            "Location saved successfully."
        );

        return Ok(response);
    }

    /// <summary>Enable or disable a service center.</summary>
    /// <param name="id">The service center ID</param>
    /// <param name="request">Center status change payload</param>
    /// <remarks>
    /// Sets the center's <c>is_active</c> flag which controls whether the center is available
    /// for booking across integrated flows.
    ///
    /// **Requires Admin role.**
    /// </remarks>
    /// <response code="200">Center status updated successfully</response>
    /// <response code="400">Invalid service center ID or request body</response>
    /// <response code="401">Authentication required</response>
    /// <response code="403">Admin role required</response>
    /// <response code="404">Service center not found</response>
    /// <response code="500">Internal server error occurred</response>
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<ServiceCenterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateCenterStatus(int id, [FromBody] UpdateCenterStatusRequestDto request)
    {
        if (id <= 0)
            throw new InvalidServiceCenterDataException("Service center ID must be greater than zero.");

        _logger.LogInformation(
            "Admin updating center {CenterId} status to {IsActive}. Reason: {Reason}",
            id,
            request.IsActive,
            request.Reason);

        var updated = await _serviceCenterService.UpdateCenterStatusAsync(id, request.IsActive);

        var response = new ApiResponse<ServiceCenterDto>(
            updated,
            new ResponseMetadata { CorrelationId = HttpContext.TraceIdentifier },
            request.IsActive
                ? "Service center enabled successfully."
                : "Service center disabled successfully."
        );

        return Ok(response);
    }
}
