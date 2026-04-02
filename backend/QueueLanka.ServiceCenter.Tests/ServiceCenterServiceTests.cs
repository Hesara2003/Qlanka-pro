using FluentAssertions;
using Moq;
using QueueLanka.ServiceCenter.Data;
using QueueLanka.ServiceCenter.DTOs.ServiceCenter;
using QueueLanka.ServiceCenter.Services;
using QueueLanka.Shared.Exceptions;

namespace QueueLanka.ServiceCenter.Tests;

public class ServiceCenterServiceTests
{
    private readonly Mock<IServiceCenterRepository> _repo = new();

    [Fact]
    public async Task CreateServiceCenterAsync_DuplicateNameAndAddress_ThrowsDuplicateException()
    {
        _repo.Setup(x => x.ExistsByNameAndAddressAsync("Main Center", "Colombo"))
            .ReturnsAsync(true);
        var service = new ServiceCenterService(_repo.Object);

        Func<Task> act = async () => await service.CreateServiceCenterAsync(new CreateServiceCenterRequestDto
        {
            Name = "Main Center",
            Address = "Colombo",
            Timezone = "Asia/Colombo",
            OpeningTime = "08:00",
            ClosingTime = "17:00"
        });

        await act.Should().ThrowAsync<DuplicateServiceCenterException>();
    }

    [Fact]
    public async Task CreateServiceCenterAsync_ClosingBeforeOpening_ThrowsInvalidDataException()
    {
        _repo.Setup(x => x.ExistsByNameAndAddressAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(false);
        var service = new ServiceCenterService(_repo.Object);

        Func<Task> act = async () => await service.CreateServiceCenterAsync(new CreateServiceCenterRequestDto
        {
            Name = "Kandy Center",
            Address = "Kandy",
            Timezone = "Asia/Colombo",
            OpeningTime = "17:00",
            ClosingTime = "08:00"
        });

        await act.Should().ThrowAsync<InvalidServiceCenterDataException>()
            .WithMessage("*ClosingTime*");
    }

    [Fact]
    public async Task CreateServiceCenterAsync_LatitudeWithoutLongitude_ThrowsInvalidDataException()
    {
        _repo.Setup(x => x.ExistsByNameAndAddressAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(false);
        var service = new ServiceCenterService(_repo.Object);

        Func<Task> act = async () => await service.CreateServiceCenterAsync(new CreateServiceCenterRequestDto
        {
            Name = "Galle Center",
            Address = "Galle",
            Timezone = "Asia/Colombo",
            OpeningTime = "08:00",
            ClosingTime = "17:00",
            Latitude = 6.03m
        });

        await act.Should().ThrowAsync<InvalidServiceCenterDataException>()
            .WithMessage("*Latitude and Longitude*");
    }

    [Fact]
    public async Task CreateServiceCenterAsync_ValidRequest_MapsTrimmedFieldsAndDefaultCountry()
    {
        QueueLanka.ServiceCenter.Models.ServiceCenter? saved = null;

        _repo.Setup(x => x.ExistsByNameAndAddressAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(false);
        _repo.Setup(x => x.CreateAsync(It.IsAny<QueueLanka.ServiceCenter.Models.ServiceCenter>()))
            .Callback<QueueLanka.ServiceCenter.Models.ServiceCenter>(center =>
            {
                center.CenterId = 100;
                center.CreatedAt = DateTime.UtcNow;
                saved = center;
            })
            .ReturnsAsync(() => saved!);

        var service = new ServiceCenterService(_repo.Object);

        var result = await service.CreateServiceCenterAsync(new CreateServiceCenterRequestDto
        {
            Name = "  Matara Center  ",
            Address = "  Main Road  ",
            Timezone = "Asia/Colombo",
            OpeningTime = "08:00",
            ClosingTime = "17:00",
            StreetAddress = "  No 10  ",
            City = "  Matara  ",
            Latitude = 5.95m,
            Longitude = 80.55m,
            Country = null
        });

        saved.Should().NotBeNull();
        saved!.Name.Should().Be("Matara Center");
        saved.Address.Should().Be("Main Road");
        saved.Location.Should().NotBeNull();
        saved.Location!.StreetAddress.Should().Be("No 10");
        saved.Location.City.Should().Be("Matara");
        saved.Location.Country.Should().Be("Sri Lanka");
        result.CenterId.Should().Be(100);
    }

    [Fact]
    public async Task GetLocationAsync_CenterNotFound_ThrowsServiceCenterNotFoundException()
    {
        _repo.Setup(x => x.GetByIdAsync(999)).ReturnsAsync((QueueLanka.ServiceCenter.Models.ServiceCenter?)null);
        var service = new ServiceCenterService(_repo.Object);

        Func<Task> act = async () => await service.GetLocationAsync(999);

        await act.Should().ThrowAsync<ServiceCenterNotFoundException>();
    }

    [Fact]
    public async Task UpsertLocationAsync_MissingCenter_ThrowsServiceCenterNotFoundException()
    {
        _repo.Setup(x => x.GetByIdAsync(999)).ReturnsAsync((QueueLanka.ServiceCenter.Models.ServiceCenter?)null);
        var service = new ServiceCenterService(_repo.Object);

        Func<Task> act = async () => await service.UpsertLocationAsync(999, new UpsertLocationRequestDto
        {
            City = "Colombo"
        });

        await act.Should().ThrowAsync<ServiceCenterNotFoundException>();
    }
}
