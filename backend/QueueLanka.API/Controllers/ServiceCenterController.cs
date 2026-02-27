using Microsoft.AspNetCore.Mvc;
using QueueLanka.API.DTOs.ServiceCenter;
using QueueLanka.API.Services;

namespace QueueLanka.API.Controllers;

[ApiController]
[Route("api/service-centers")]
[Produces("application/json")]
public class ServiceCenterController : ControllerBase
{
    private readonly IServiceCenterService _serviceCenterService;

    public ServiceCenterController(IServiceCenterService serviceCenterService)
    {
        _serviceCenterService = serviceCenterService;
    }

    /// <summary>Get all service centers with availability information.</summary>
    /// <response code="200">List of service centers retrieved successfully.</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ServiceCenterDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllServiceCenters()
    {
        var centers = await _serviceCenterService.GetAllServiceCentersAsync();
        return Ok(centers);
    }

    /// <summary>Get a specific service center by ID.</summary>
    /// <param name="id">The service center ID.</param>
    /// <response code="200">Service center retrieved successfully.</response>
    /// <response code="404">Service center not found.</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ServiceCenterDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetServiceCenterById(int id)
    {
        var center = await _serviceCenterService.GetServiceCenterByIdAsync(id);
        
        if (center == null)
            return NotFound(new { code = "CENTER_NOT_FOUND", message = $"Service center with ID {id} not found." });

        return Ok(center);
    }
}
