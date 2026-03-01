using QueueLanka.API.DTOs.ServiceCenter;

namespace QueueLanka.API.Services;

public interface IServiceCenterService
{
    Task<IEnumerable<ServiceCenterDto>> GetAllServiceCentersAsync();
    Task<ServiceCenterDto?> GetServiceCenterByIdAsync(int centerId);

    /// <summary>
    /// Validates and creates a new service center, seeding its default operating-day schedule.
    /// Throws <see cref="QueueLanka.API.Exceptions.DuplicateServiceCenterException"/> when a
    /// center with the same name and address already exists.
    /// </summary>
    Task<ServiceCenterDto> CreateServiceCenterAsync(CreateServiceCenterRequestDto dto);
}
