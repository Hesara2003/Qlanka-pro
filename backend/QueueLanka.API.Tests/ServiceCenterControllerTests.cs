using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using QueueLanka.API.Controllers;
using QueueLanka.API.DTOs.ServiceCenter;
using QueueLanka.API.Services;

namespace QueueLanka.API.Tests;

public class ServiceCenterControllerTests
{
    // ── shared helpers ────────────────────────────────────────────────────────

    // Creates a controller with a fresh mock for each test.
    private static (ServiceCenterController controller, Mock<IServiceCenterService> mockService)
        CreateController()
    {
        var mockService = new Mock<IServiceCenterService>();
        var controller  = new ServiceCenterController(mockService.Object);
        return (controller, mockService);
    }

    // Builds a sample ServiceCenterDto so we don't repeat the same setup code.
    private static ServiceCenterDto SampleCenter(int id = 1) => new()
    {
        CenterId      = id,
        Name          = $"Test Center {id}",
        Address       = "123 Test Street",
        Phone         = "0771234567",
        Email         = "test@center.lk",
        Description   = "A sample service center",
        Timezone      = "Asia/Colombo",
        Capacity      = 50,
        OpeningTime   = "08:00",
        ClosingTime   = "17:00",
        IsAvailable   = true,
        IsActive      = true,
        CreatedAt     = DateTime.UtcNow
    };

    // ── GetAllServiceCenters ──────────────────────────────────────────────────

    [Fact]
    public async Task GetAllServiceCenters_ReturnsOk()
    {
        // Arrange
        var (controller, mockService) = CreateController();

        mockService
            .Setup(s => s.GetAllServiceCentersAsync())
            .ReturnsAsync(new List<ServiceCenterDto> { SampleCenter(1), SampleCenter(2) });

        // Act
        var result = await controller.GetAllServiceCenters();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAllServiceCenters_ReturnsListOfServiceCenters()
    {
        // Arrange
        var (controller, mockService) = CreateController();

        var expectedCenters = new List<ServiceCenterDto> { SampleCenter(1), SampleCenter(2) };

        mockService
            .Setup(s => s.GetAllServiceCentersAsync())
            .ReturnsAsync(expectedCenters);

        // Act
        var result      = await controller.GetAllServiceCenters() as OkObjectResult;
        var returnedList = result!.Value as IEnumerable<ServiceCenterDto>;

        // Assert
        returnedList.Should().NotBeNull();
        returnedList.Should().HaveCount(2);
    }

    // ── GetServiceCenterById ──────────────────────────────────────────────────

    [Fact]
    public async Task GetServiceCenterById_ValidId_ReturnsOk()
    {
        // Arrange
        var (controller, mockService) = CreateController();

        mockService
            .Setup(s => s.GetServiceCenterByIdAsync(1))
            .ReturnsAsync(SampleCenter(1));

        // Act
        var result = await controller.GetServiceCenterById(1);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetServiceCenterById_ValidId_ReturnsCorrectCenter()
    {
        // Arrange
        var (controller, mockService) = CreateController();

        var expected = SampleCenter(1);

        mockService
            .Setup(s => s.GetServiceCenterByIdAsync(1))
            .ReturnsAsync(expected);

        // Act
        var result          = await controller.GetServiceCenterById(1) as OkObjectResult;
        var returnedCenter  = result!.Value as ServiceCenterDto;

        // Assert
        returnedCenter.Should().NotBeNull();
        returnedCenter!.CenterId.Should().Be(1);
        returnedCenter.Name.Should().Be("Test Center 1");
    }

    [Fact]
    public async Task GetServiceCenterById_InvalidId_ReturnsNotFound()
    {
        // Arrange
        var (controller, mockService) = CreateController();

        mockService
            .Setup(s => s.GetServiceCenterByIdAsync(999))
            .ReturnsAsync((ServiceCenterDto?)null);   // simulate "not found"

        // Act
        var result = await controller.GetServiceCenterById(999);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }
}
