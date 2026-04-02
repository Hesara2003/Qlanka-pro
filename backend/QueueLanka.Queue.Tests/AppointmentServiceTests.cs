using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Appointment;
using QueueLanka.Queue.Integration;
using QueueLanka.Queue.Models;
using QueueLanka.Queue.Services;
using QueueLanka.Shared.Events;
using QueueLanka.Shared.Exceptions;

namespace QueueLanka.Queue.Tests;

public class AppointmentServiceTests
{
    private readonly Mock<IAppointmentRepository> _appointments = new();
    private readonly Mock<IServiceCenterClient> _centers = new();
    private readonly Mock<ITokenRepository> _tokens = new();
    private readonly Mock<IEventBus> _events = new();

    private AppointmentService CreateService()
        => new(_appointments.Object, _centers.Object, _tokens.Object, _events.Object, NullLogger<AppointmentService>.Instance);

    private static BookAppointmentRequestDto RequestFor(DateTime date, TimeSpan time, int centerId = 1)
        => new()
        {
            CenterId = centerId,
            AppointmentDate = date,
            AppointmentTime = time
        };

    [Fact]
    public async Task BookTokenAsync_WhenCenterMissing_ThrowsArgumentException()
    {
        _centers.Setup(x => x.GetCenterAsync(1)).ReturnsAsync((ServiceCenterDto?)null);
        var service = CreateService();

        Func<Task> act = async () => await service.BookTokenAsync(10, RequestFor(DateTime.UtcNow.Date.AddDays(1), new TimeSpan(10, 0, 0)));

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task BookTokenAsync_WhenBookingInPast_ThrowsInvalidOperationException()
    {
        _centers.Setup(x => x.GetCenterAsync(1)).ReturnsAsync(new ServiceCenterDto
        {
            CenterId = 1,
            Name = "Center",
            IsActive = true,
            Capacity = 10,
            OpeningTime = new TimeSpan(8, 0, 0),
            ClosingTime = new TimeSpan(17, 0, 0)
        });

        var service = CreateService();
        Func<Task> act = async () => await service.BookTokenAsync(10, RequestFor(DateTime.UtcNow.Date.AddDays(-1), new TimeSpan(10, 0, 0)));

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task BookTokenAsync_WhenCenterClosedOnSpecificDate_ThrowsInvalidOperationException()
    {
        var requestedDate = DateTime.UtcNow.Date.AddDays(1);
        _centers.Setup(x => x.GetCenterAsync(1)).ReturnsAsync(new ServiceCenterDto
        {
            CenterId = 1,
            Name = "Center",
            IsActive = true,
            Capacity = 10,
            OpeningTime = new TimeSpan(8, 0, 0),
            ClosingTime = new TimeSpan(17, 0, 0)
        });
        _centers.Setup(x => x.GetAvailabilityAsync(1, requestedDate)).ReturnsAsync(new CenterAvailabilityDto
        {
            IsAvailable = false,
            Reason = "Holiday"
        });

        var service = CreateService();
        Func<Task> act = async () => await service.BookTokenAsync(10, RequestFor(requestedDate, new TimeSpan(10, 0, 0)));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*closed*");
    }

    [Fact]
    public async Task BookTokenAsync_WhenAtomicResultDuplicate_ThrowsDuplicateBookingException()
    {
        var requestedDate = DateTime.UtcNow.Date.AddDays(1);
        _centers.Setup(x => x.GetCenterAsync(1)).ReturnsAsync(new ServiceCenterDto
        {
            CenterId = 1,
            Name = "Center",
            IsActive = true,
            Capacity = 10,
            OpeningTime = new TimeSpan(8, 0, 0),
            ClosingTime = new TimeSpan(17, 0, 0)
        });
        _centers.Setup(x => x.GetAvailabilityAsync(1, requestedDate)).ReturnsAsync((CenterAvailabilityDto?)null);
        _centers.Setup(x => x.GetOperatingDaysAsync(1)).ReturnsAsync(new List<CenterOperatingDayDto>
        {
            new() { DayOfWeek = requestedDate.DayOfWeek.ToString().ToLowerInvariant(), IsOpen = true, OpeningTime = new TimeSpan(8,0,0), ClosingTime = new TimeSpan(17,0,0) }
        });
        _appointments.Setup(x => x.BookAtomicAsync(1, 10, requestedDate, new TimeSpan(10, 0, 0), It.IsAny<string>(), 10))
            .ReturnsAsync((0, 0, "DUPLICATE_BOOKING"));

        var service = CreateService();
        Func<Task> act = async () => await service.BookTokenAsync(10, RequestFor(requestedDate, new TimeSpan(10, 0, 0)));

        await act.Should().ThrowAsync<DuplicateBookingException>();
    }

    [Fact]
    public async Task BookTokenAsync_WhenAtomicResultCenterFull_ThrowsCenterFullException()
    {
        var requestedDate = DateTime.UtcNow.Date.AddDays(1);
        _centers.Setup(x => x.GetCenterAsync(1)).ReturnsAsync(new ServiceCenterDto
        {
            CenterId = 1,
            Name = "Center",
            IsActive = true,
            Capacity = 10,
            OpeningTime = new TimeSpan(8, 0, 0),
            ClosingTime = new TimeSpan(17, 0, 0)
        });
        _centers.Setup(x => x.GetAvailabilityAsync(1, requestedDate)).ReturnsAsync((CenterAvailabilityDto?)null);
        _centers.Setup(x => x.GetOperatingDaysAsync(1)).ReturnsAsync(new List<CenterOperatingDayDto>
        {
            new() { DayOfWeek = requestedDate.DayOfWeek.ToString().ToLowerInvariant(), IsOpen = true, OpeningTime = new TimeSpan(8,0,0), ClosingTime = new TimeSpan(17,0,0) }
        });
        _appointments.Setup(x => x.BookAtomicAsync(1, 10, requestedDate, new TimeSpan(10, 0, 0), It.IsAny<string>(), 10))
            .ReturnsAsync((0, 0, "CENTER_FULL"));

        var service = CreateService();
        Func<Task> act = async () => await service.BookTokenAsync(10, RequestFor(requestedDate, new TimeSpan(10, 0, 0)));

        await act.Should().ThrowAsync<CenterFullException>();
    }

    [Fact]
    public async Task GetUserAppointmentsAsync_MapsLinkedTokenData()
    {
        _appointments.Setup(x => x.GetByUserIdAsync(10)).ReturnsAsync(new List<Appointment>
        {
            new()
            {
                AppointmentId = 100,
                CenterId = 5,
                UserId = 10,
                AppointmentDate = new DateTime(2026, 1, 5),
                AppointmentTime = new TimeSpan(10, 0, 0),
                Status = "Scheduled",
                CreatedAt = new DateTime(2026, 1, 1)
            }
        });
        _tokens.Setup(x => x.GetByUserIdAsync(10)).ReturnsAsync(new List<Token>
        {
            new() { TokenId = 200, AppointmentId = 100, TokenNumber = "A200" }
        });

        var service = CreateService();
        var result = (await service.GetUserAppointmentsAsync(10)).Single();

        result.AppointmentId.Should().Be(100);
        result.TokenId.Should().Be(200);
        result.TokenNumber.Should().Be("A200");
    }
}
