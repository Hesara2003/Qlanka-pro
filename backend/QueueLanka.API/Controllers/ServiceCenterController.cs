using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QueueLanka.API.DTOs.Common;
using QueueLanka.API.DTOs.ServiceCenter;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Services;

namespace QueueLanka.API.Controllers;

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
}
