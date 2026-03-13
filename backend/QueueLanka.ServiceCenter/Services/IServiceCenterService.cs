using QueueLanka.ServiceCenter.DTOs.ServiceCenter;

namespace QueueLanka.ServiceCenter.Services;

public interface IServiceCenterService
{
    Task<IEnumerable<ServiceCenterDto>> GetAllServiceCentersAsync();
    Task<ServiceCenterDto?> GetServiceCenterByIdAsync(int centerId);

    /// <summary>
    /// Validates and creates a new service center, seeding its default operating-day schedule.
    /// Throws <see cref="QueueLanka.Shared.Exceptions.DuplicateServiceCenterException"/> when a
    /// center with the same name and address already exists.
    /// </summary>
    Task<ServiceCenterDto> CreateServiceCenterAsync(CreateServiceCenterRequestDto dto);

    // ── Location ──────────────────────────────────────────────────

    /// <summary>
    /// Returns the structured location for a center.
    /// Throws <see cref="QueueLanka.Shared.Exceptions.ServiceCenterNotFoundException"/> when the
    /// center does not exist, and <see cref="QueueLanka.Shared.Exceptions.LocationNotFoundException"/>
    /// when no location row has been recorded yet.
    /// </summary>
    Task<CenterLocationDto> GetLocationAsync(int centerId);

    /// <summary>
    /// Creates or replaces the structured location row for an existing center.
    /// Throws <see cref="QueueLanka.Shared.Exceptions.ServiceCenterNotFoundException"/> when the
    /// center does not exist.
    /// </summary>
    Task<CenterLocationDto> UpsertLocationAsync(int centerId, UpsertLocationRequestDto dto);
}
