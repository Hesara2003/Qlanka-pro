using QueueLanka.API.Data;
using QueueLanka.API.DTOs.ServiceCenter;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Models;

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

    public async Task<ServiceCenterDto> CreateServiceCenterAsync(CreateServiceCenterRequestDto dto)
    {
        // Guard against duplicate name + address combinations.
        bool exists = await _serviceCenterRepository.ExistsByNameAndAddressAsync(dto.Name, dto.Address);
        if (exists)
            throw new DuplicateServiceCenterException(dto.Name, dto.Address);

        // Parse validated time strings into TimeSpan (format guaranteed by regex annotation).
        var openingTime = TimeSpan.Parse(dto.OpeningTime);
        var closingTime = TimeSpan.Parse(dto.ClosingTime);

        if (closingTime <= openingTime)
            throw new InvalidServiceCenterDataException(
                "ClosingTime must be later than OpeningTime.");

        var center = new ServiceCenter
        {
            Name                      = dto.Name.Trim(),
            Address                   = dto.Address.Trim(),
            Phone                     = dto.Phone?.Trim(),
            Email                     = dto.Email?.Trim().ToLowerInvariant(),
            Description               = dto.Description?.Trim(),
            Timezone                  = dto.Timezone.Trim(),
            Capacity                  = dto.Capacity,
            AverageServiceTimeMinutes = dto.AverageServiceTimeMinutes,
            OpeningTime               = openingTime,
            ClosingTime               = closingTime,
            IsActive                  = dto.IsActive,
        };

        var created = await _serviceCenterRepository.CreateAsync(center);

        return new ServiceCenterDto
        {
            CenterId                  = created.CenterId,
            Name                      = created.Name,
            Address                   = created.Address,
            Phone                     = created.Phone,
            Email                     = created.Email,
            Description               = created.Description,
            Timezone                  = created.Timezone,
            Capacity                  = created.Capacity,
            AverageServiceTimeMinutes = created.AverageServiceTimeMinutes,
            OpeningTime               = created.OpeningTime.ToString(@"hh\:mm"),
            ClosingTime               = created.ClosingTime.ToString(@"hh\:mm"),
            IsAvailable               = created.IsActive,
            IsActive                  = created.IsActive,
            CreatedAt                 = created.CreatedAt,
        };
    }
}
