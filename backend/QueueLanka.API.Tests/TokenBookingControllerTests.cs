using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;
using System.Security.Claims;
using Xunit;
using QueueLanka.API.Controllers;
using QueueLanka.API.DTOs.Appointment;
using QueueLanka.API.Services;

namespace QueueLanka.API.Tests;


public class TokenBookingControllerTests
{
    

    private readonly Mock<IAppointmentService> _mockService;
    private readonly AppointmentController _controller;

    public TokenBookingControllerTests()
    {
        _mockService = new Mock<IAppointmentService>();

        _controller = new AppointmentController(_mockService.Object);

        // user with UserId = 1
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
        }, "TestAuth"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    

    private static BookAppointmentRequestDto CreateSampleRequest() => new()
    {
        CenterId = 1,
        AppointmentDate = DateTime.UtcNow.Date.AddDays(1),
        AppointmentTime = new TimeSpan(10, 0, 0)
    };

    

    private static AppointmentResponseDto CreateSampleResponse(
        int appointmentId = 1,
        string tokenNumber = "TKN-1-250301-AB12") => new()
    {
        AppointmentId = appointmentId,
        CenterId = 1,
        UserId = 1,
        TokenId = 100,
        TokenNumber = tokenNumber,
        AppointmentDate = DateTime.UtcNow.Date.AddDays(1),
        AppointmentTime = new TimeSpan(10, 0, 0),
        Status = "Scheduled",
        CreatedAt = DateTime.UtcNow
    };

    
    [Fact]
    public async Task BookToken_ShouldReturn200OK_WhenBookingIsSuccessful()
    {
        // Arrange
        var request = CreateSampleRequest();
        var expected = CreateSampleResponse();

        _mockService
            .Setup(s => s.BookTokenAsync(1, request))
            .ReturnsAsync(expected);

        // Act
        var result = await _controller.BookToken(request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

   
    [Fact]
    public async Task BookToken_ShouldReturn409Conflict_WhenBookingConflictDetected()
    {
        
        var request = CreateSampleRequest();

        _mockService
            .Setup(s => s.BookTokenAsync(1, request))
            .ThrowsAsync(new InvalidOperationException(
                "This time slot is already booked. Please select another time."));

        
        var result = await _controller.BookToken(request);

        
        var conflictResult = result as ConflictObjectResult;
        conflictResult.Should().NotBeNull();
        conflictResult!.StatusCode.Should().Be(409);
    }

    
    [Fact]
    public async Task GetMyAppointments_ShouldReturn200OK_WhenUserHasBookings()
    {
        
        var bookings = new List<AppointmentResponseDto>
        {
            CreateSampleResponse(appointmentId: 1),
            CreateSampleResponse(appointmentId: 2, tokenNumber: "TKN-1-250301-CD34")
        };

        _mockService
            .Setup(s => s.GetUserAppointmentsAsync(1))
            .ReturnsAsync(bookings);

        
        var result = await _controller.GetMyAppointments();

        
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedList = okResult.Value as List<AppointmentResponseDto>;
        returnedList.Should().NotBeNull();
        returnedList!.Count.Should().Be(2);
    }

    
    [Fact]
    public async Task GetMyAppointments_ShouldReturn200OK_WithEmptyList_WhenNoBookings()
    {
        
        _mockService
            .Setup(s => s.GetUserAppointmentsAsync(1))
            .ReturnsAsync(new List<AppointmentResponseDto>());

        
        var result = await _controller.GetMyAppointments();

      
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedList = okResult!.Value as List<AppointmentResponseDto>;
        returnedList.Should().NotBeNull();
        returnedList!.Count.Should().Be(0);
    }

    
    [Fact]
    public async Task BookToken_ShouldGenerateUniqueToken_ForEachBooking()
    {
      
        var request1 = CreateSampleRequest();
        var request2 = CreateSampleRequest();

        var response1 = CreateSampleResponse(appointmentId: 1, tokenNumber: "TKN-1-250301-AAAA");
        var response2 = CreateSampleResponse(appointmentId: 2, tokenNumber: "TKN-1-250301-BBBB");

        _mockService
            .SetupSequence(s => s.BookTokenAsync(1, It.IsAny<BookAppointmentRequestDto>()))
            .ReturnsAsync(response1)
            .ReturnsAsync(response2);

   
        var result1 = await _controller.BookToken(request1);
        var result2 = await _controller.BookToken(request2);

        
        var ok1 = result1 as OkObjectResult;
        var ok2 = result2 as OkObjectResult;

        ok1.Should().NotBeNull();
        ok2.Should().NotBeNull();

        var dto1 = ok1!.Value as AppointmentResponseDto;
        var dto2 = ok2!.Value as AppointmentResponseDto;

        dto1.Should().NotBeNull();
        dto2.Should().NotBeNull();
        dto1!.TokenNumber.Should().NotBe(dto2!.TokenNumber,
            "each booking must get a unique token number");
    }

   
    [Fact]
    public async Task BookToken_ShouldReturnConflict_WhenTwoUsersBookSameSlot()
    {
        
        var request = CreateSampleRequest();

        _mockService
            .Setup(s => s.BookTokenAsync(It.IsAny<int>(), request))
            .ThrowsAsync(new InvalidOperationException(
                "This time slot is already booked. Please select another time."));

        
        var result = await _controller.BookToken(request);

        
        var conflictResult = result as ConflictObjectResult;
        conflictResult.Should().NotBeNull();
        conflictResult!.StatusCode.Should().Be(409);
    }

   
    [Fact]
    public async Task BookToken_ShouldReturnConfirmationResponse_AfterSuccessfulBooking()
    {
        
        var request = CreateSampleRequest();
        var expected = CreateSampleResponse();

        _mockService
            .Setup(s => s.BookTokenAsync(1, request))
            .ReturnsAsync(expected);

        
        var result = await _controller.BookToken(request);

        
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var response = okResult!.Value as AppointmentResponseDto;
        response.Should().NotBeNull();
        response!.AppointmentId.Should().BeGreaterThan(0);
        response.TokenNumber.Should().NotBeNullOrEmpty(
            "a confirmation must include the token number");
        response.Status.Should().Be("Scheduled");
    }

   
    [Fact]
    public async Task BookToken_ShouldReturn404NotFound_WhenServiceCenterNotFound()
    {
        
        var request = CreateSampleRequest();

        _mockService
            .Setup(s => s.BookTokenAsync(1, request))
            .ThrowsAsync(new ArgumentException(
                "Service center not found or is currently inactive."));

        
        var result = await _controller.BookToken(request);

       
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    
    [Fact]
    public async Task BookToken_ShouldReturn401Unauthorized_WhenUserClaimIsMissing()
    {
        
        var controller = new AppointmentController(_mockService.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity()) 
                }
            }
        };

        var request = CreateSampleRequest();

  
        var result = await controller.BookToken(request);

        
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }
}
