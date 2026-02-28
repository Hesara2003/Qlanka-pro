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
        var today = DateTime.Today;
        
        var centerDtos = new List<ServiceCenterDto>();
        
        foreach (var center in centers)
        {
            // Check if there's a specific availability override for today
            var availability = await _serviceCenterRepository.GetAvailabilityForDateAsync(center.CenterId, today);
            
            // Determine if center is available (considering both is_active and today's availability)
            bool isAvailable = center.IsActive && (availability?.IsAvailable ?? true);
            
            centerDtos.Add(new ServiceCenterDto
            {
                CenterId    = center.CenterId,
                Name        = center.Name,
                Address     = center.Address,
                Phone       = center.Phone,
                Email       = center.Email,
                Description = center.Description,
                Timezone    = center.Timezone,
                Capacity    = center.Capacity,
                AverageServiceTimeMinutes = center.AverageServiceTimeMinutes,
                OpeningTime = (availability?.OpeningTime ?? center.OpeningTime).ToString(@"hh\:mm"),
                ClosingTime = (availability?.ClosingTime ?? center.ClosingTime).ToString(@"hh\:mm"),
                IsAvailable = isAvailable,
                IsActive    = center.IsActive,
                CreatedAt   = center.CreatedAt
            });
        }

        return centerDtos;
    }

    public async Task<ServiceCenterDto?> GetServiceCenterByIdAsync(int centerId)
    {
        var center = await _serviceCenterRepository.GetByIdAsync(centerId);
        
        if (center == null)
            return null;

        var today = DateTime.Today;
        var availability = await _serviceCenterRepository.GetAvailabilityForDateAsync(centerId, today);
        
        // Determine if center is available
        bool isAvailable = center.IsActive && (availability?.IsAvailable ?? true);

        return new ServiceCenterDto
        {
            CenterId    = center.CenterId,
            Name        = center.Name,
            Address     = center.Address,
            Phone       = center.Phone,
            Email       = center.Email,
            Description = center.Description,
            Timezone    = center.Timezone,
            Capacity    = center.Capacity,
            AverageServiceTimeMinutes = center.AverageServiceTimeMinutes,
            OpeningTime = (availability?.OpeningTime ?? center.OpeningTime).ToString(@"hh\:mm"),
            ClosingTime = (availability?.ClosingTime ?? center.ClosingTime).ToString(@"hh\:mm"),
            IsAvailable = isAvailable,
            IsActive    = center.IsActive,
            CreatedAt   = center.CreatedAt
        };
    }
}
