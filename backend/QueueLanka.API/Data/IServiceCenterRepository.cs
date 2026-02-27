using QueueLanka.API.Models;

namespace QueueLanka.API.Data;

public interface IServiceCenterRepository
{
    Task<IEnumerable<ServiceCenter>> GetAllAsync();
    Task<ServiceCenter?> GetByIdAsync(int centerId);
}
