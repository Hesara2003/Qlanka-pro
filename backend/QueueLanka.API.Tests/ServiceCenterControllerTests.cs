using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using QueueLanka.API.Controllers;
using QueueLanka.API.DTOs.ServiceCenter;
using QueueLanka.API.Services;

namespace QueueLanka.API.Tests;

public class ServiceCenterControllerTests
{
   

   
    private static (ServiceCenterController controller, Mock<IServiceCenterService> mockService)
        CreateController()
    {
        var mockService = new Mock<IServiceCenterService>();
        var controller  = new ServiceCenterController(mockService.Object);
        return (controller, mockService);
    }

   
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

 
    [Fact]
    public async Task GetAllServiceCenters_ReturnsOk()
    {
     
        var (controller, mockService) = CreateController();

        mockService
            .Setup(s => s.GetAllServiceCentersAsync())
            .ReturnsAsync(new List<ServiceCenterDto> { SampleCenter(1), SampleCenter(2) });

     
        var result = await controller.GetAllServiceCenters();

        
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAllServiceCenters_ReturnsListOfServiceCenters()
    {

        var (controller, mockService) = CreateController();

        var expectedCenters = new List<ServiceCenterDto> { SampleCenter(1), SampleCenter(2) };

        mockService
            .Setup(s => s.GetAllServiceCentersAsync())
            .ReturnsAsync(expectedCenters);

        
        var result      = await controller.GetAllServiceCenters() as OkObjectResult;
        var returnedList = result!.Value as IEnumerable<ServiceCenterDto>;

        
        returnedList.Should().NotBeNull();
        returnedList.Should().HaveCount(2);
    }

   

    [Fact]
    public async Task GetServiceCenterById_ValidId_ReturnsOk()
    {

        var (controller, mockService) = CreateController();

        mockService
            .Setup(s => s.GetServiceCenterByIdAsync(1))
            .ReturnsAsync(SampleCenter(1));


        var result = await controller.GetServiceCenterById(1);


        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetServiceCenterById_ValidId_ReturnsCorrectCenter()
    {
    
        var (controller, mockService) = CreateController();

        var expected = SampleCenter(1);

        mockService
            .Setup(s => s.GetServiceCenterByIdAsync(1))
            .ReturnsAsync(expected);

  
        var result          = await controller.GetServiceCenterById(1) as OkObjectResult;
        var returnedCenter  = result!.Value as ServiceCenterDto;

    
        returnedCenter.Should().NotBeNull();
        returnedCenter!.CenterId.Should().Be(1);
        returnedCenter.Name.Should().Be("Test Center 1");
    }

    [Fact]
    public async Task GetServiceCenterById_InvalidId_ReturnsNotFound()
    {
       
        var (controller, mockService) = CreateController();

        mockService
            .Setup(s => s.GetServiceCenterByIdAsync(999))
            .ReturnsAsync((ServiceCenterDto?)null);   

      
        var result = await controller.GetServiceCenterById(999);

       
        result.Should().BeOfType<NotFoundObjectResult>();
    }
}
