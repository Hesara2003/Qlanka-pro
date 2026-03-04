using QueueLanka.ServiceCenter.Models;

namespace QueueLanka.ServiceCenter.Data;

public interface IServiceCenterRepository
{
    Task<IEnumerable<ServiceCenter>> GetAllAsync();
    Task<ServiceCenter?> GetByIdAsync(int centerId);
    Task<CenterAvailability?> GetAvailabilityForDateAsync(int centerId, DateTime date);
    Task<IEnumerable<CenterOperatingDay>> GetOperatingDaysAsync(int centerId);
    Task<bool> IsCenterAvailableAsync(int centerId, DateTime date);

    /// <summary>Persists a new service center row (and optional location row) atomically.</summary>
    Task<ServiceCenter> CreateAsync(ServiceCenter center);

    /// <summary>
    /// Returns <c>true</c> when a center with the same (case-insensitive) name AND address
    /// already exists — used to prevent accidental duplicates on creation.
    /// </summary>
    Task<bool> ExistsByNameAndAddressAsync(string name, string address);

    // ── Location ───────────────────────────────────────────────────

    /// <summary>Loads the structured location row for a center. Returns <c>null</c> when absent.</summary>
    Task<CenterLocation?> GetLocationAsync(int centerId);

    /// <summary>
    /// INSERT … ON DUPLICATE KEY UPDATE: creates or fully replaces the location row
    /// for the given center. Returns the saved entity with its <c>LocationId</c> populated.
    /// </summary>
    Task<CenterLocation> UpsertLocationAsync(CenterLocation location);
}
