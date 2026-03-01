using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public interface IServiceCenterRepository
{
    Task<IEnumerable<ServiceCenter>> GetAllAsync();
    Task<ServiceCenter?> GetByIdAsync(int centerId);
    Task<CenterAvailability?> GetAvailabilityForDateAsync(int centerId, DateTime date);
    Task<IEnumerable<CenterOperatingDay>> GetOperatingDaysAsync(int centerId);
    Task<bool> IsCenterAvailableAsync(int centerId, DateTime date);

    /// <summary>Persists a new service center row and returns the entity with its generated ID.</summary>
    Task<ServiceCenter> CreateAsync(ServiceCenter center);

    /// <summary>
    /// Returns <c>true</c> when a center with the same (case-insensitive) name AND address
    /// already exists — used to prevent accidental duplicates on creation.
    /// </summary>
    Task<bool> ExistsByNameAndAddressAsync(string name, string address);
}
