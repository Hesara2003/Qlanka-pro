using QueueLanka.API.Data;
using QueueLanka.API.DTOs.ServiceCenter;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Models;

namespace QueueLanka.API.Services;

public class ServiceCenterService : IServiceCenterService
{
    private readonly IServiceCenterRepository _repo;

    public ServiceCenterService(IServiceCenterRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<ServiceCenterDto>> GetAllServiceCentersAsync()
    {
        var centers = await _repo.GetAllAsync();
        var today   = DateTime.Today;
        var dtos    = new List<ServiceCenterDto>();

        foreach (var center in centers)
        {
            var availability = await _repo.GetAvailabilityForDateAsync(center.CenterId, today);
            dtos.Add(MapToDto(center, availability, center.IsActive && (availability?.IsAvailable ?? true)));
        }

        return dtos;
    }

    public async Task<ServiceCenterDto?> GetServiceCenterByIdAsync(int centerId)
    {
        var center = await _repo.GetByIdAsync(centerId);
        if (center is null) return null;

        var availability = await _repo.GetAvailabilityForDateAsync(centerId, DateTime.Today);
        return MapToDto(center, availability, center.IsActive && (availability?.IsAvailable ?? true));
    }

    public async Task<ServiceCenterDto> CreateServiceCenterAsync(CreateServiceCenterRequestDto dto)
    {
        if (await _repo.ExistsByNameAndAddressAsync(dto.Name, dto.Address))
            throw new DuplicateServiceCenterException(dto.Name, dto.Address);

        var openingTime = TimeSpan.Parse(dto.OpeningTime);
        var closingTime = TimeSpan.Parse(dto.ClosingTime);

        if (closingTime <= openingTime)
            throw new InvalidServiceCenterDataException("ClosingTime must be later than OpeningTime.");

        if (dto.Latitude.HasValue != dto.Longitude.HasValue)
            throw new InvalidServiceCenterDataException("Latitude and Longitude must be provided together.");

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

        bool hasLocationData =
            dto.StreetAddress is not null || dto.City is not null ||
            dto.District is not null      || dto.Province is not null ||
            dto.PostalCode is not null    || dto.Latitude.HasValue ||
            dto.GoogleMapsUrl is not null || dto.Landmark is not null;

        if (hasLocationData)
        {
            center.Location = new CenterLocation
            {
                StreetAddress = dto.StreetAddress?.Trim(),
                City          = dto.City?.Trim(),
                District      = dto.District?.Trim(),
                Province      = dto.Province?.Trim(),
                PostalCode    = dto.PostalCode?.Trim(),
                Country       = (dto.Country ?? "Sri Lanka").Trim(),
                Latitude      = dto.Latitude,
                Longitude     = dto.Longitude,
                GoogleMapsUrl = dto.GoogleMapsUrl?.Trim(),
                Landmark      = dto.Landmark?.Trim(),
            };
        }

        var created = await _repo.CreateAsync(center);
        return MapToDto(created, availability: null, isAvailable: created.IsActive);
    }

    // ── Location ──────────────────────────────────────────────────

    public async Task<CenterLocationDto> GetLocationAsync(int centerId)
    {
        // Validate the center exists first so callers get a 404 with the right code.
        var center = await _repo.GetByIdAsync(centerId)
            ?? throw new ServiceCenterNotFoundException(centerId);

        var location = center.Location
            ?? await _repo.GetLocationAsync(centerId);

        return location is null
            ? throw new LocationNotFoundException(centerId)
            : MapLocationToDto(location);
    }

    public async Task<CenterLocationDto> UpsertLocationAsync(int centerId, UpsertLocationRequestDto dto)
    {
        // Validate center exists.
        var centerExists = await _repo.GetByIdAsync(centerId);
        if (centerExists is null)
            throw new ServiceCenterNotFoundException(centerId);

        if (dto.Latitude.HasValue != dto.Longitude.HasValue)
            throw new InvalidServiceCenterDataException("Latitude and Longitude must be provided together.");

        var location = new CenterLocation
        {
            CenterId      = centerId,
            StreetAddress = dto.StreetAddress?.Trim(),
            City          = dto.City?.Trim(),
            District      = dto.District?.Trim(),
            Province      = dto.Province?.Trim(),
            PostalCode    = dto.PostalCode?.Trim(),
            Country       = (dto.Country ?? "Sri Lanka").Trim(),
            Latitude      = dto.Latitude,
            Longitude     = dto.Longitude,
            GoogleMapsUrl = dto.GoogleMapsUrl?.Trim(),
            Landmark      = dto.Landmark?.Trim(),
        };

        var saved = await _repo.UpsertLocationAsync(location);
        return MapLocationToDto(saved);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private static ServiceCenterDto MapToDto(
        ServiceCenter center,
        CenterAvailability? availability,
        bool isAvailable)
    {
        return new ServiceCenterDto
        {
            CenterId                  = center.CenterId,
            Name                      = center.Name,
            Address                   = center.Address,
            Phone                     = center.Phone,
            Email                     = center.Email,
            Description               = center.Description,
            Timezone                  = center.Timezone,
            Capacity                  = center.Capacity,
            AverageServiceTimeMinutes = center.AverageServiceTimeMinutes,
            OpeningTime               = (availability?.OpeningTime ?? center.OpeningTime).ToString(@"hh\:mm"),
            ClosingTime               = (availability?.ClosingTime ?? center.ClosingTime).ToString(@"hh\:mm"),
            IsAvailable               = isAvailable,
            IsActive                  = center.IsActive,
            CreatedAt                 = center.CreatedAt,
            Location                  = center.Location is null ? null : MapLocationToDto(center.Location),
        };
    }

    private static CenterLocationDto MapLocationToDto(CenterLocation loc) => new()
    {
        LocationId    = loc.LocationId,
        StreetAddress = loc.StreetAddress,
        City          = loc.City,
        District      = loc.District,
        Province      = loc.Province,
        PostalCode    = loc.PostalCode,
        Country       = loc.Country,
        Latitude      = loc.Latitude,
        Longitude     = loc.Longitude,
        GoogleMapsUrl = loc.GoogleMapsUrl,
        Landmark      = loc.Landmark,
    };
}

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
        var today   = DateTime.Today;

        var centerDtos = new List<ServiceCenterDto>();

        foreach (var center in centers)
        {
            var availability = await _serviceCenterRepository.GetAvailabilityForDateAsync(center.CenterId, today);
            bool isAvailable = center.IsActive && (availability?.IsAvailable ?? true);

            centerDtos.Add(MapToDto(center, availability, isAvailable));
        }

        return centerDtos;
    }

    public async Task<ServiceCenterDto?> GetServiceCenterByIdAsync(int centerId)
    {
        var center = await _serviceCenterRepository.GetByIdAsync(centerId);
        if (center is null) return null;

        var availability = await _serviceCenterRepository.GetAvailabilityForDateAsync(centerId, DateTime.Today);
        bool isAvailable = center.IsActive && (availability?.IsAvailable ?? true);

        return MapToDto(center, availability, isAvailable);
    }

    public async Task<ServiceCenterDto> CreateServiceCenterAsync(CreateServiceCenterRequestDto dto)
    {
        bool exists = await _serviceCenterRepository.ExistsByNameAndAddressAsync(dto.Name, dto.Address);
        if (exists)
            throw new DuplicateServiceCenterException(dto.Name, dto.Address);

        var openingTime = TimeSpan.Parse(dto.OpeningTime);
        var closingTime = TimeSpan.Parse(dto.ClosingTime);

        if (closingTime <= openingTime)
            throw new InvalidServiceCenterDataException("ClosingTime must be later than OpeningTime.");

        // Coordinates must be paired (both or neither) — guards against partial input
        // that passes individual [Range] annotations but violates the DB CHECK constraint.
        if ((dto.Latitude.HasValue) != (dto.Longitude.HasValue))
            throw new InvalidServiceCenterDataException(
                "Latitude and Longitude must be provided together.");

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

        // Build structured location if any location field was supplied.
        bool hasLocationData =
            dto.StreetAddress is not null || dto.City is not null ||
            dto.District is not null      || dto.Province is not null ||
            dto.PostalCode is not null    || dto.Latitude.HasValue ||
            dto.GoogleMapsUrl is not null || dto.Landmark is not null;

        if (hasLocationData)
        {
            center.Location = new CenterLocation
            {
                StreetAddress = dto.StreetAddress?.Trim(),
                City          = dto.City?.Trim(),
                District      = dto.District?.Trim(),
                Province      = dto.Province?.Trim(),
                PostalCode    = dto.PostalCode?.Trim(),
                Country       = (dto.Country ?? "Sri Lanka").Trim(),
                Latitude      = dto.Latitude,
                Longitude     = dto.Longitude,
                GoogleMapsUrl = dto.GoogleMapsUrl?.Trim(),
                Landmark      = dto.Landmark?.Trim(),
            };
        }

        var created = await _serviceCenterRepository.CreateAsync(center);
        return MapToDto(created, availability: null, isAvailable: created.IsActive);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static ServiceCenterDto MapToDto(
        ServiceCenter center,
        CenterAvailability? availability,
        bool isAvailable)
    {
        return new ServiceCenterDto
        {
            CenterId                  = center.CenterId,
            Name                      = center.Name,
            Address                   = center.Address,
            Phone                     = center.Phone,
            Email                     = center.Email,
            Description               = center.Description,
            Timezone                  = center.Timezone,
            Capacity                  = center.Capacity,
            AverageServiceTimeMinutes = center.AverageServiceTimeMinutes,
            OpeningTime               = (availability?.OpeningTime ?? center.OpeningTime).ToString(@"hh\:mm"),
            ClosingTime               = (availability?.ClosingTime ?? center.ClosingTime).ToString(@"hh\:mm"),
            IsAvailable               = isAvailable,
            IsActive                  = center.IsActive,
            CreatedAt                 = center.CreatedAt,
            Location                  = center.Location is null ? null : new CenterLocationDto
            {
                LocationId    = center.Location.LocationId,
                StreetAddress = center.Location.StreetAddress,
                City          = center.Location.City,
                District      = center.Location.District,
                Province      = center.Location.Province,
                PostalCode    = center.Location.PostalCode,
                Country       = center.Location.Country,
                Latitude      = center.Location.Latitude,
                Longitude     = center.Location.Longitude,
                GoogleMapsUrl = center.Location.GoogleMapsUrl,
                Landmark      = center.Location.Landmark,
            },
        };
    }
}
