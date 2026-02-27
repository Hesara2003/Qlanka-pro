using QueueLanka.API.Data;
using QueueLanka.API.DTOs.ServiceCenter;

namespace QueueLanka.API.Services;

public class ServiceCenterService : IServiceCenterService
{
    private readonly IServiceCenterRepository _serviceCenterRepository;

    public ServiceCenterService(IServiceCenterRepository serviceCenterRepository)
    {
        _serviceCenterRepository = serviceCenterRepository;
    }

    public async Task<IEnumerable<ServiceCenterDto>> GetAllServiceCentersAsync()
    {
        var centers = await _serviceCenterRepository.GetAllAsync();
        
        return centers.Select(center => new ServiceCenterDto
        {
            CenterId = center.CenterId,
            Name = center.Name,
            Address = center.Address,
            Timezone = center.Timezone,
            Capacity = center.Capacity,
            IsAvailable = center.IsActive, // Availability is based on IsActive status
            CreatedAt = center.CreatedAt
        });
    }

    public async Task<ServiceCenterDto?> GetServiceCenterByIdAsync(int centerId)
    {
        var center = await _serviceCenterRepository.GetByIdAsync(centerId);
        
        if (center == null)
            return null;

        return new ServiceCenterDto
        {
            CenterId = center.CenterId,
            Name = center.Name,
            Address = center.Address,
            Timezone = center.Timezone,
            Capacity = center.Capacity,
            IsAvailable = center.IsActive, // Availability is based on IsActive status
            CreatedAt = center.CreatedAt
        };
    }
}
