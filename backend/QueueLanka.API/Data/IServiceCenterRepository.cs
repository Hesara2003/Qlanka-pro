using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public interface IServiceCenterRepository
{
    Task<IEnumerable<ServiceCenter>> GetAllAsync();
    Task<ServiceCenter?> GetByIdAsync(int centerId);
    Task<CenterAvailability?> GetAvailabilityForDateAsync(int centerId, DateTime date);
    Task<IEnumerable<CenterOperatingDay>> GetOperatingDaysAsync(int centerId);
    Task<bool> IsCenterAvailableAsync(int centerId, DateTime date);
}
