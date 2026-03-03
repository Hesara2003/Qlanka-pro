using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using QueueLanka.API.Controllers;
using QueueLanka.API.DTOs.Common;
using QueueLanka.API.DTOs.ServiceCenter;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Services;

namespace QueueLanka.API.Tests;

public class ServiceCenterControllerTests
{
    private readonly Mock<IServiceCenterService> _mockService;
    private readonly Mock<ILogger<ServiceCenterController>> _mockLogger;
    private readonly ServiceCenterController _controller;

    public ServiceCenterControllerTests()
    {
        _mockService = new Mock<IServiceCenterService>();
        _mockLogger = new Mock<ILogger<ServiceCenterController>>();
        _controller = new ServiceCenterController(_mockService.Object, _mockLogger.Object);

        // Provide an HttpContext so HttpContext.TraceIdentifier works
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    // ────────────────────── GetAllServiceCenters Tests ──────────────────────

    [Fact]
    public async Task GetAllServiceCenters_ValidRequest_ReturnsOkWithList()
    {
        // Arrange
        var centers = new List<ServiceCenterDto>
        {
            new ServiceCenterDto { CenterId = 1, Name = "Center A", IsActive = true },
            new ServiceCenterDto { CenterId = 2, Name = "Center B", IsActive = true }
        };
        _mockService
            .Setup(s => s.GetAllServiceCentersAsync())
            .ReturnsAsync(centers);

        // Act
        var result = await _controller.GetAllServiceCenters();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<ServiceCenterDto>>>().Subject;
        response.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAllServiceCenters_EmptyList_ReturnsOkWithEmptyList()
    {
        // Arrange
        _mockService
            .Setup(s => s.GetAllServiceCentersAsync())
            .ReturnsAsync(new List<ServiceCenterDto>());

        // Act
        var result = await _controller.GetAllServiceCenters();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<ServiceCenterDto>>>().Subject;
        response.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAllServiceCenters_ServiceThrows_Throws()
    {
        // Arrange
        _mockService
            .Setup(s => s.GetAllServiceCentersAsync())
            .ThrowsAsync(new DataAccessException("DB error"));

        // Act
        Func<Task> act = async () => await _controller.GetAllServiceCenters();

        // Assert
        await act.Should().ThrowAsync<DataAccessException>();
    }

    // ────────────────────── GetServiceCenterById Tests ──────────────────────

    [Fact]
    public async Task GetServiceCenterById_ValidId_ReturnsOk()
    {
        // Arrange
        var center = new ServiceCenterDto { CenterId = 1, Name = "Center A", IsActive = true };
        _mockService
            .Setup(s => s.GetServiceCenterByIdAsync(1))
            .ReturnsAsync(center);

        // Act
        var result = await _controller.GetServiceCenterById(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var response = okResult.Value.Should().BeOfType<ApiResponse<ServiceCenterDto>>().Subject;
        response.Data!.Name.Should().Be("Center A");
    }

    [Fact]
    public async Task GetServiceCenterById_InvalidId_ThrowsInvalidServiceCenterDataException()
    {
        // Arrange & Act
        Func<Task> act = async () => await _controller.GetServiceCenterById(0);

        // Assert
        await act.Should().ThrowAsync<InvalidServiceCenterDataException>();
    }

    [Fact]
    public async Task GetServiceCenterById_NegativeId_ThrowsInvalidServiceCenterDataException()
    {
        // Arrange & Act
        Func<Task> act = async () => await _controller.GetServiceCenterById(-5);

        // Assert
        await act.Should().ThrowAsync<InvalidServiceCenterDataException>();
    }

    [Fact]
    public async Task GetServiceCenterById_NotFound_ThrowsServiceCenterNotFoundException()
    {
        // Arrange
        _mockService
            .Setup(s => s.GetServiceCenterByIdAsync(999))
            .ReturnsAsync((ServiceCenterDto?)null);

        // Act
        Func<Task> act = async () => await _controller.GetServiceCenterById(999);

        // Assert
        await act.Should().ThrowAsync<ServiceCenterNotFoundException>();
    }

    // ────────────────────── CheckAvailability Tests ──────────────────────

    [Fact]
    public async Task CheckAvailability_Available_ReturnsOkWithTrue()
    {
        // Arrange
        var center = new ServiceCenterDto { CenterId = 1, IsAvailable = true, IsActive = true };
        _mockService
            .Setup(s => s.GetServiceCenterByIdAsync(1))
            .ReturnsAsync(center);

        // Act
        var result = await _controller.CheckAvailability(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<bool>>().Subject;
        response.Data.Should().BeTrue();
    }

    [Fact]
    public async Task CheckAvailability_NotAvailable_ReturnsOkWithFalse()
    {
        // Arrange
        var center = new ServiceCenterDto { CenterId = 1, IsAvailable = false, IsActive = true };
        _mockService
            .Setup(s => s.GetServiceCenterByIdAsync(1))
            .ReturnsAsync(center);

        // Act
        var result = await _controller.CheckAvailability(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<bool>>().Subject;
        response.Data.Should().BeFalse();
    }

    [Fact]
    public async Task CheckAvailability_NotActive_ReturnsOkWithFalse()
    {
        // Arrange
        var center = new ServiceCenterDto { CenterId = 1, IsAvailable = true, IsActive = false };
        _mockService
            .Setup(s => s.GetServiceCenterByIdAsync(1))
            .ReturnsAsync(center);

        // Act
        var result = await _controller.CheckAvailability(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<bool>>().Subject;
        response.Data.Should().BeFalse();
    }

    [Fact]
    public async Task CheckAvailability_InvalidId_ThrowsInvalidServiceCenterDataException()
    {
        // Arrange & Act
        Func<Task> act = async () => await _controller.CheckAvailability(0);

        // Assert
        await act.Should().ThrowAsync<InvalidServiceCenterDataException>();
    }

    [Fact]
    public async Task CheckAvailability_NotFound_ThrowsServiceCenterNotFoundException()
    {
        // Arrange
        _mockService
            .Setup(s => s.GetServiceCenterByIdAsync(999))
            .ReturnsAsync((ServiceCenterDto?)null);

        // Act
        Func<Task> act = async () => await _controller.CheckAvailability(999);

        // Assert
        await act.Should().ThrowAsync<ServiceCenterNotFoundException>();
    }

    // ────────────────────── CreateServiceCenter Tests ──────────────────────

    [Fact]
    public async Task CreateServiceCenter_ValidRequest_Returns201Created()
    {
        // Arrange
        var request = new CreateServiceCenterRequestDto
        {
            Name = "New Center",
            Address = "123 Main Street",
            Timezone = "Asia/Colombo"
        };
        var created = new ServiceCenterDto
        {
            CenterId = 10,
            Name = "New Center",
            Address = "123 Main Street",
            IsActive = true
        };
        _mockService
            .Setup(s => s.CreateServiceCenterAsync(request))
            .ReturnsAsync(created);

        // Act
        var result = await _controller.CreateServiceCenter(request);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(201);

        var response = createdResult.Value.Should().BeOfType<ApiResponse<ServiceCenterDto>>().Subject;
        response.Data!.CenterId.Should().Be(10);
        response.Data.Name.Should().Be("New Center");
    }

    [Fact]
    public async Task CreateServiceCenter_DuplicateCenter_ThrowsDuplicateServiceCenterException()
    {
        // Arrange
        var request = new CreateServiceCenterRequestDto
        {
            Name = "Existing Center",
            Address = "456 Elm Street"
        };
        _mockService
            .Setup(s => s.CreateServiceCenterAsync(request))
            .ThrowsAsync(new DuplicateServiceCenterException("Existing Center", "456 Elm Street"));

        // Act
        Func<Task> act = async () => await _controller.CreateServiceCenter(request);

        // Assert
        await act.Should().ThrowAsync<DuplicateServiceCenterException>();
    }

    [Fact]
    public async Task CreateServiceCenter_ServiceThrows_Throws()
    {
        // Arrange
        var request = new CreateServiceCenterRequestDto
        {
            Name = "Center",
            Address = "Address"
        };
        _mockService
            .Setup(s => s.CreateServiceCenterAsync(request))
            .ThrowsAsync(new DataAccessException("DB error"));

        // Act
        Func<Task> act = async () => await _controller.CreateServiceCenter(request);

        // Assert
        await act.Should().ThrowAsync<DataAccessException>();
    }

    // ────────────────────── GetLocation Tests ──────────────────────

    [Fact]
    public async Task GetLocation_ValidId_ReturnsOk()
    {
        // Arrange
        var location = new CenterLocationDto
        {
            LocationId = 1,
            City = "Colombo",
            Country = "Sri Lanka"
        };
        _mockService
            .Setup(s => s.GetLocationAsync(1))
            .ReturnsAsync(location);

        // Act
        var result = await _controller.GetLocation(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var response = okResult.Value.Should().BeOfType<ApiResponse<CenterLocationDto>>().Subject;
        response.Data!.City.Should().Be("Colombo");
    }

    [Fact]
    public async Task GetLocation_InvalidId_ThrowsInvalidServiceCenterDataException()
    {
        // Arrange & Act
        Func<Task> act = async () => await _controller.GetLocation(0);

        // Assert
        await act.Should().ThrowAsync<InvalidServiceCenterDataException>();
    }

    [Fact]
    public async Task GetLocation_CenterNotFound_ThrowsServiceCenterNotFoundException()
    {
        // Arrange
        _mockService
            .Setup(s => s.GetLocationAsync(999))
            .ThrowsAsync(new ServiceCenterNotFoundException(999));

        // Act
        Func<Task> act = async () => await _controller.GetLocation(999);

        // Assert
        await act.Should().ThrowAsync<ServiceCenterNotFoundException>();
    }

    [Fact]
    public async Task GetLocation_LocationNotFound_ThrowsLocationNotFoundException()
    {
        // Arrange
        _mockService
            .Setup(s => s.GetLocationAsync(1))
            .ThrowsAsync(new LocationNotFoundException(1));

        // Act
        Func<Task> act = async () => await _controller.GetLocation(1);

        // Assert
        await act.Should().ThrowAsync<LocationNotFoundException>();
    }

    // ────────────────────── UpsertLocation Tests ──────────────────────

    [Fact]
    public async Task UpsertLocation_ValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new UpsertLocationRequestDto
        {
            City = "Kandy",
            Country = "Sri Lanka"
        };
        var location = new CenterLocationDto
        {
            LocationId = 1,
            City = "Kandy",
            Country = "Sri Lanka"
        };
        _mockService
            .Setup(s => s.UpsertLocationAsync(1, request))
            .ReturnsAsync(location);

        // Act
        var result = await _controller.UpsertLocation(1, request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var response = okResult.Value.Should().BeOfType<ApiResponse<CenterLocationDto>>().Subject;
        response.Data!.City.Should().Be("Kandy");
    }

    [Fact]
    public async Task UpsertLocation_InvalidId_ThrowsInvalidServiceCenterDataException()
    {
        // Arrange
        var request = new UpsertLocationRequestDto { City = "Colombo" };

        // Act
        Func<Task> act = async () => await _controller.UpsertLocation(0, request);

        // Assert
        await act.Should().ThrowAsync<InvalidServiceCenterDataException>();
    }

    [Fact]
    public async Task UpsertLocation_CenterNotFound_ThrowsServiceCenterNotFoundException()
    {
        // Arrange
        var request = new UpsertLocationRequestDto { City = "Colombo" };
        _mockService
            .Setup(s => s.UpsertLocationAsync(999, request))
            .ThrowsAsync(new ServiceCenterNotFoundException(999));

        // Act
        Func<Task> act = async () => await _controller.UpsertLocation(999, request);

        // Assert
        await act.Should().ThrowAsync<ServiceCenterNotFoundException>();
    }

    [Fact]
    public async Task UpsertLocation_ServiceThrows_Throws()
    {
        // Arrange
        var request = new UpsertLocationRequestDto { City = "Galle" };
        _mockService
            .Setup(s => s.UpsertLocationAsync(1, request))
            .ThrowsAsync(new DataAccessException("DB error"));

        // Act
        Func<Task> act = async () => await _controller.UpsertLocation(1, request);

        // Assert
        await act.Should().ThrowAsync<DataAccessException>();
    }
}
